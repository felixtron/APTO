import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const job = await prisma.jobPosting.update({
    where: { id },
    data: {
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type || "FULL_TIME",
      description: data.description,
      requirements: data.requirements || null,
      salary: data.salary || null,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      active: data.active ?? true,
      membersOnly: data.membersOnly ?? false,
      expiresAt: new Date(data.expiresAt),
    },
  });

  return NextResponse.json(job);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.jobPosting.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
