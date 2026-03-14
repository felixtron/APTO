import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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
  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    "status",
    "type",
    "subscriptionEnd",
    "name",
    "phone",
    "institution",
    "cedula",
    "specialty",
  ];
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "subscriptionEnd" && body[field]) {
        data[field] = new Date(body[field]);
      } else {
        data[field] = body[field];
      }
    }
  }

  const member = await prisma.member.update({ where: { id }, data });
  return NextResponse.json(member);
}
