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

  const degrees =
    typeof data.degrees === "string"
      ? data.degrees
          .split(",")
          .map((d: string) => d.trim())
          .filter(Boolean)
      : data.degrees ?? undefined;

  const university = await prisma.university.update({
    where: { id },
    data: {
      name: data.name,
      shortName: data.shortName || null,
      description: data.description || null,
      degrees,
      location: data.location,
      website: data.website || null,
      logoUrl: data.logoUrl ?? undefined,
      active: data.active ?? undefined,
      displayOrder: data.displayOrder ?? undefined,
    },
  });

  return NextResponse.json(university);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.university.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
