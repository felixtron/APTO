import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const newsletter = await prisma.newsletter.findUnique({ where: { id } });

  if (!newsletter) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (newsletter.status === "SENT") {
    return NextResponse.json(
      { error: "Este boletín ya fue enviado" },
      { status: 400 }
    );
  }

  // Get all active members with email
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { email: true, name: true },
  });

  if (members.length === 0) {
    return NextResponse.json(
      { error: "No hay miembros activos para enviar" },
      { status: 400 }
    );
  }

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "APTO <noreply@apto.org.mx>";

  const htmlContent = buildNewsletterHtml(newsletter.subject, newsletter.content);

  // Send in batches of 50 (Resend batch limit)
  const emails = members.map((m) => m.email);
  const batchSize = 50;
  let totalSent = 0;

  try {
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPayload = batch.map((to) => ({
        from,
        to,
        subject: newsletter.subject,
        html: htmlContent,
      }));

      await resend.batch.send(batchPayload);
      totalSent += batch.length;
    }

    await prisma.newsletter.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        recipientCount: totalSent,
      },
    });

    return NextResponse.json({ success: true, recipientCount: totalSent });
  } catch (error) {
    console.error("Newsletter send error:", error);

    await prisma.newsletter.update({
      where: { id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: "Error al enviar el boletín" },
      { status: 500 }
    );
  }
}

function buildNewsletterHtml(subject: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:#2E6DA4;border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">APTO</h1>
      <p style="color:#ccdaeb;margin:8px 0 0;font-size:13px;">
        Asociación de Profesionales en Terapia Ocupacional A.C.
      </p>
    </div>

    <!-- Content -->
    <div style="background:#fff;padding:32px 24px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
      <h2 style="color:#18181b;margin:0 0 20px;font-size:20px;">${subject}</h2>
      <div style="color:#3f3f46;font-size:15px;line-height:1.7;">
        ${content}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#fafafa;border-radius:0 0 12px 12px;padding:24px;text-align:center;border:1px solid #e4e4e7;border-top:0;">
      <p style="color:#71717a;font-size:12px;margin:0;">
        Asociación de Profesionales en Terapia Ocupacional A.C.<br />
        Calle Acapulco 36, Desp. 203, Col. Roma Norte, CDMX<br />
        <a href="https://apto.org.mx" style="color:#2E6DA4;">apto.org.mx</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
