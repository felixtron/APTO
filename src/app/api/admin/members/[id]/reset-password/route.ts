import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/html";
import {
  ADMIN_ISSUED_RESET_TTL_MS,
  buildResetUrl,
  createPasswordResetToken,
} from "@/lib/password-reset";

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
    select: { email: true, name: true, passwordHash: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Same flow as forgot-password, with a longer expiry for admin-initiated resets
  const token = createPasswordResetToken(member, ADMIN_ISSUED_RESET_TTL_MS);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
  const resetUrl = buildResetUrl(token);
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
        <h2 style="color:#333;">Hola ${escapeHtml(member.name)},</h2>
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
