import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import {
  buildResetUrl,
  createPasswordResetToken,
  SELF_SERVICE_RESET_TTL_MS,
} from "@/lib/password-reset";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "Si tu email está registrado, recibirás instrucciones para restablecer tu contraseña.";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const limit = checkRateLimit("passwordReset", [
      getClientIp(request.headers),
      normalizedEmail,
    ]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const member = await prisma.member.findUnique({
      where: { email: normalizedEmail },
      select: { email: true, passwordHash: true },
    });

    if (member) {
      const token = createPasswordResetToken(member, SELF_SERVICE_RESET_TTL_MS);
      const resetUrl = buildResetUrl(token);
      const from = process.env.RESEND_FROM || "APTO <noreply@apto.org.mx>";

      const resend = getResend();
      const { data, error } = await resend.emails.send({
        from,
        to: member.email,
        subject: "Restablecer contraseña — APTO",
        html: `
          <h2>Restablecer contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en APTO.</p>
          <p><a href="${resetUrl}" style="background:#2E6DA4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Restablecer contraseña</a></p>
          <p>Este enlace expira en 1 hora.</p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
        `,
      });

      if (error) {
        console.error("Resend error (forgot-password):", error);
      } else {
        console.info("Password reset email sent:", data?.id);
      }
    }

    // Always return success to avoid revealing if email exists
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }
}
