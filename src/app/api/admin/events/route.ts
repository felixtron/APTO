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

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      _count: { select: { registrations: true } },
    },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const event = await prisma.event.create({
    data: {
      title: data.title,
      slug: slugify(data.title),
      description: data.description || "",
      coverImage: data.coverImage || null,
      scheduledAt: new Date(data.scheduledAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      modality: data.modality || "VIRTUAL",
      location: data.location || null,
      meetLink: data.meetLink || null,
      price: data.price ?? 0,
      maxCapacity: data.maxCapacity || null,
      active: data.active ?? true,
      stripePriceId: data.stripePriceId || null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
