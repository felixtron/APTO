import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  // Password change flow
  if (body.currentPassword && body.newPassword) {
    const member = await prisma.member.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(body.currentPassword, member.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);

    await prisma.member.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "Contraseña actualizada" });
  }

  // Profile update flow
  const { name, phone, institution, cedula, specialty } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }

  const updated = await prisma.member.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      institution: institution?.trim() || null,
      cedula: cedula?.trim() || null,
      specialty: specialty?.trim() || null,
    },
    select: {
      name: true,
      email: true,
      phone: true,
      institution: true,
      cedula: true,
      specialty: true,
      memberNumber: true,
    },
  });

  return NextResponse.json(updated);
}
