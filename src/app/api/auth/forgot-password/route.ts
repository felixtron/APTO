import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Si tu email está registrado, recibirás instrucciones para restablecer tu contraseña." },
        { status: 200 }
      );
    }

    const member = await prisma.member.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (member) {
      const secret = process.env.NEXTAUTH_SECRET!;
      const payload = JSON.stringify({ email: member.email, exp: Date.now() + 3600000 }); // 1 hour
      const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = Buffer.from(payload).toString("base64url") + "." + signature;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
      const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
      const from = process.env.RESEND_FROM || "APTO <noreply@apto.org.mx>";

      const resend = getResend();
      await resend.emails.send({
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
    }

    // Always return success to avoid revealing if email exists
    return NextResponse.json(
      { message: "Si tu email está registrado, recibirás instrucciones para restablecer tu contraseña." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Si tu email está registrado, recibirás instrucciones para restablecer tu contraseña." },
      { status: 200 }
    );
  }
}
