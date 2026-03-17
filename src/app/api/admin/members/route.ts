import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateMemberNumber(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${digits}${initials}`;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    const email = data.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un miembro con este email" },
        { status: 400 }
      );
    }

    // Generate a random temporary password (member will reset it)
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Generate unique member number
    let memberNumber = generateMemberNumber(data.name);
    let attempts = 0;
    while (attempts < 5) {
      const dup = await prisma.member.findUnique({ where: { memberNumber } });
      if (!dup) break;
      memberNumber = generateMemberNumber(data.name);
      attempts++;
    }

    // Calculate subscription end (1 year from now by default)
    const subscriptionEnd = data.subscriptionEnd
      ? new Date(data.subscriptionEnd)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const member = await prisma.member.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        phone: data.phone || null,
        memberNumber,
        type: "PROFESSIONAL",
        status: "ACTIVE",
        institution: data.institution || null,
        cedula: data.cedula || null,
        specialty: data.specialty || null,
        subscriptionEnd,
      },
    });

    return NextResponse.json(
      {
        id: member.id,
        name: member.name,
        email: member.email,
        memberNumber: member.memberNumber,
        status: member.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Error al crear miembro" },
      { status: 500 }
    );
  }
}
