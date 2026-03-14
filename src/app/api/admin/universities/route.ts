import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const universities = await prisma.university.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(universities);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const maxOrder = await prisma.university.aggregate({
    _max: { displayOrder: true },
  });

  const degrees =
    typeof data.degrees === "string"
      ? data.degrees
          .split(",")
          .map((d: string) => d.trim())
          .filter(Boolean)
      : data.degrees || [];

  const university = await prisma.university.create({
    data: {
      name: data.name,
      shortName: data.shortName || null,
      description: data.description || null,
      degrees,
      location: data.location,
      website: data.website || null,
      logoUrl: data.logoUrl || null,
      active: data.active ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(university, { status: 201 });
}
