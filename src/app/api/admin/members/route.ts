import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createMembershipCertificate } from "@/lib/generate-certificate";
import {
  createWithMemberNumber,
  findMemberNumberConflict,
  isUniqueViolation,
} from "@/lib/assign-member-number";
import { normalizeMemberNumber } from "@/lib/member-number";

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

    // An explicit number lets the admin seat someone the roster could not
    // match by email (no email on file, or one shared with another person).
    const requestedNumber =
      typeof data.memberNumber === "string" && data.memberNumber.trim()
        ? normalizeMemberNumber(data.memberNumber)
        : null;
    if (data.memberNumber && !requestedNumber) {
      return NextResponse.json(
        { error: "Número de socio inválido (formato LTO0000)" },
        { status: 400 }
      );
    }
    if (requestedNumber) {
      const conflict = await findMemberNumberConflict(
        requestedNumber,
        { email },
        data.allowReserved === true
      );
      if (conflict) {
        return NextResponse.json(
          { error: conflict.message, overridable: conflict.overridable },
          { status: 409 }
        );
      }
    }

    // Calculate subscription end (1 year from now by default)
    const subscriptionEnd = data.subscriptionEnd
      ? new Date(data.subscriptionEnd)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const createMember = (memberNumber: string) =>
      prisma.member.create({
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
    const member = requestedNumber
      ? await createMember(requestedNumber)
      : (await createWithMemberNumber(email, createMember)).record;

    // Auto-create membership certificate
    await createMembershipCertificate(member.id);

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
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "El email o el número de socio ya está en uso" },
        { status: 409 }
      );
    }
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Error al crear miembro" },
      { status: 500 }
    );
  }
}
