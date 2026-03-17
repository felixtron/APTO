import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getResend } from "@/lib/resend";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    select: { email: true, name: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Generate reset token (same flow as forgot-password)
  const secret = process.env.NEXTAUTH_SECRET!;
  const payload = JSON.stringify({
    email: member.email,
    exp: Date.now() + 7 * 24 * 3600000, // 7 days for admin-initiated resets
  });
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const token =
    Buffer.from(payload).toString("base64url") + "." + signature;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
  const from = process.env.RESEND_FROM || "APTO <noreply@apto.org.mx>";

  const resend = getResend();
  await resend.emails.send({
    from,
    to: member.email,
    subject: "Crea tu contraseña — APTO",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="text-align:center;padding:24px 0;">
          <img src="${baseUrl}/logo/logoAPTO.png" alt="APTO" height="48" />
        </div>
        <h2 style="color:#333;">Hola ${member.name},</h2>
        <p>El administrador de APTO te ha enviado un enlace para crear o restablecer tu contraseña de acceso al portal de miembros.</p>
        <p style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#2E6DA4;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
            Crear mi contraseña
          </a>
        </p>
        <p style="color:#666;font-size:14px;">Este enlace expira en 7 días.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">APTO — Asociación de Profesionales en Terapia Ocupacional A.C.</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, email: member.email });
}
