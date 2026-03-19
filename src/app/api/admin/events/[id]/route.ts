import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  // Check if title changed to regenerate slug
  const existing = await prisma.event.findUnique({ where: { id } });
  const slug =
    data.title && data.title !== existing?.title
      ? slugify(data.title)
      : undefined;

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      ...(slug ? { slug } : {}),
      description: data.description,
      coverImage: data.coverImage ?? undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : undefined,
      modality: data.modality ?? undefined,
      location: data.location !== undefined ? (data.location || null) : undefined,
      meetLink: data.meetLink !== undefined ? (data.meetLink || null) : undefined,
      price: data.price ?? undefined,
      priceStudent: data.priceStudent ?? undefined,
      priceProfessional: data.priceProfessional ?? undefined,
      maxCapacity: data.maxCapacity !== undefined ? (data.maxCapacity || null) : undefined,
      active: data.active ?? undefined,
      membersOnly: data.membersOnly ?? undefined,
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

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
