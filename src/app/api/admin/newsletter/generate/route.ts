import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic } = await request.json();

  // Gather context: recent posts and events
  const [recentPosts, upcomingEvents] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, excerpt: true, category: true },
    }),
    prisma.event.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      select: { title: true, scheduledAt: true, modality: true },
    }),
  ]);

  const contextParts: string[] = [];

  if (recentPosts.length > 0) {
    contextParts.push(
      "NOTICIAS RECIENTES DE APTO:\n" +
        recentPosts.map((p) => `- ${p.title}: ${p.excerpt || ""}`).join("\n")
    );
  }

  if (upcomingEvents.length > 0) {
    contextParts.push(
      "PRÓXIMOS EVENTOS:\n" +
        upcomingEvents
          .map(
            (e) =>
              `- ${e.title} (${e.scheduledAt.toLocaleDateString("es-MX")}, ${e.modality})`
          )
          .join("\n")
    );
  }

  const topicInstruction = topic
    ? `El tema principal de este boletín es: "${topic}".`
    : "Genera un boletín general con las últimas novedades.";

  const prompt = `Eres el editor del boletín de APTO (Asociación de Profesionales en Terapia Ocupacional A.C.), una asociación profesional mexicana fundada en 1993, miembro de WFOT y CLATO.

${topicInstruction}

${contextParts.length > 0 ? contextParts.join("\n\n") : "No hay contenido reciente en la plataforma, genera contenido relevante sobre terapia ocupacional."}

Genera un boletín en español con formato HTML inline (sin CSS externo, solo estilos inline).

Estructura del boletín:
1. Saludo breve y cálido a los miembros
2. Sección principal con el tema o novedades (2-3 párrafos)
3. Si hay eventos próximos, mencionarlos brevemente
4. Si hay noticias recientes, hacer un resumen
5. Cierre con llamado a la acción

Reglas:
- Tono profesional pero cercano
- Máximo 500 palabras
- Usa etiquetas HTML simples: <p>, <h3>, <strong>, <ul>, <li>, <a>
- No incluyas <html>, <head>, <body> — solo el contenido interior
- No uses markdown, solo HTML
- Incluye emojis profesionales donde sea apropiado (máximo 3-4)

Responde SOLO con un JSON válido con esta estructura exacta:
{"subject": "Asunto del boletín", "content": "<p>Contenido HTML aquí...</p>"}`;

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text?.trim() || "";

    // Strip markdown code fences if present
    let jsonStr = text;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.subject || !parsed.content) {
      throw new Error("Invalid AI response structure");
    }

    // Save as draft
    const newsletter = await prisma.newsletter.create({
      data: {
        subject: parsed.subject,
        content: parsed.content,
        status: "DRAFT",
      },
    });

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Error al generar contenido con IA. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
