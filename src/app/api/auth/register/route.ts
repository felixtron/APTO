import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/emails";

function generateMemberNumber(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${digits}${initials}`;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, institution } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      );
    }

    // Generate unique member number
    let memberNumber = generateMemberNumber(name);
    let attempts = 0;
    while (attempts < 5) {
      const dup = await prisma.member.findUnique({ where: { memberNumber } });
      if (!dup) break;
      memberNumber = generateMemberNumber(name);
      attempts++;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.member.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        memberNumber,
        type: "PROFESSIONAL",
        institution: institution || null,
        status: "PENDING",
      },
    });

    // Fire-and-forget: send welcome email without blocking the response
    sendWelcomeEmail({ name, email, memberNumber }).catch(console.error);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
