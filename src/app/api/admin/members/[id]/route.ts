import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseJsonBody } from "@/lib/validation";
import { memberNumberSchema } from "@/lib/member-number";
import { findMemberNumberConflict, isUniqueViolation } from "@/lib/assign-member-number";

// Fields an admin may see/return. Never includes passwordHash.
const MEMBER_ADMIN_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  memberNumber: true,
  type: true,
  status: true,
  institution: true,
  cedula: true,
  specialty: true,
  stripeCustomerId: true,
  subscriptionId: true,
  subscriptionEnd: true,
  createdAt: true,
  updatedAt: true,
} as const;

const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable();

// Every key is optional: absent keys are left untouched by the update.
const memberUpdateSchema = z
  .object({
    status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"], {
      error: "Estado inválido",
    }),
    type: z.enum(["PROFESSIONAL", "STUDENT"], { error: "Tipo inválido" }),
    subscriptionEnd: z.union([z.null(), z.coerce.date({ error: "Fecha inválida" })]),
    name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    memberNumber: memberNumberSchema,
    // Confirms a roster-reserved number belongs to this member (new email).
    allowReserved: z.boolean(),
    phone: nullableText(30),
    institution: nullableText(200),
    cedula: nullableText(50),
    specialty: nullableText(200),
  })
  .partial()
  .strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      ...MEMBER_ADMIN_FIELDS,
      _count: {
        select: { certificates: true, eventRegistrations: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseJsonBody(request, memberUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const { allowReserved = false, ...changes } = parsed.data;
  if (changes.memberNumber) {
    const current = await prisma.member.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const conflict = await findMemberNumberConflict(
      changes.memberNumber,
      { email: current.email, memberId: id },
      allowReserved
    );
    if (conflict) {
      return NextResponse.json(
        { error: conflict.message, overridable: conflict.overridable },
        { status: 409 }
      );
    }
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: changes,
      select: MEMBER_ADMIN_FIELDS,
    });
    return NextResponse.json(member);
  } catch (error) {
    // Another admin saved the same number between the check and the update.
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: `El número ${changes.memberNumber} ya está asignado a otro miembro` },
        { status: 409 }
      );
    }
    throw error;
  }
}
