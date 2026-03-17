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

  // If activating this event, deactivate all others first
  if (data.active) {
    await prisma.specialEvent.updateMany({
      where: { id: { not: id } },
      data: { active: false },
    });
  }

  const event = await prisma.specialEvent.update({
    where: { id },
    data: {
      slug: data.slug,
      navLabel: data.navLabel,
      title: data.title,
      description: data.description || null,
      programImage: data.programImage || null,
      registrationUrl: data.registrationUrl || null,
      active: data.active ?? undefined,
      year: data.year ? parseInt(data.year, 10) : undefined,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.specialEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
