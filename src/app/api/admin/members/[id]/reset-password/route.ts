import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendAccountAccessEmail } from "@/lib/account-access-email";

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
  await sendAccountAccessEmail(
    member,
    "El administrador de APTO te ha enviado un enlace para crear o restablecer tu contraseña de acceso al portal de miembros."
  );

  return NextResponse.json({ success: true, email: member.email });
}
