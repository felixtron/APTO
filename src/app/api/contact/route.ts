import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResend } from "@/lib/resend";
import { CONTACT_EMAIL } from "@/lib/constants";
import { escapeHtml } from "@/lib/html";
import { emailSchema, optionalText, parseJsonBody } from "@/lib/validation";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const REQUIRED_MESSAGE = "Nombre, email y mensaje son requeridos";

const contactSchema = z.object({
  name: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE).max(120),
  email: emailSchema,
  subject: optionalText(200),
  message: z
    .string({ error: REQUIRED_MESSAGE })
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .max(5000, "El mensaje es demasiado largo"),
});

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit("contact", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = await parseJsonBody(request, contactSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, subject, message } = parsed.data;

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "Sin asunto");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "APTO <noreply@apto.org.mx>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: subject || `Contacto de ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Asunto:</strong> ${safeSubject}</p>
        <hr />
        <p>${safeMessage}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}
