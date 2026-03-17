import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const events = await prisma.specialEvent.findMany({
    orderBy: { year: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // If activating this event, deactivate all others
  if (data.active) {
    await prisma.specialEvent.updateMany({
      data: { active: false },
    });
  }

  const event = await prisma.specialEvent.create({
    data: {
      slug: data.slug,
      navLabel: data.navLabel,
      title: data.title,
      description: data.description || null,
      programImage: data.programImage || null,
      registrationUrl: data.registrationUrl || null,
      active: data.active ?? false,
      year: parseInt(data.year, 10),
    },
  });

  return NextResponse.json(event, { status: 201 });
}
