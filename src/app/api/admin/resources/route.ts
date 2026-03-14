import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const maxOrder = await prisma.resource.aggregate({
    _max: { displayOrder: true },
  });

  const resource = await prisma.resource.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type || "PDF",
      fileUrl: data.fileUrl || null,
      externalUrl: data.externalUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      membersOnly: data.membersOnly ?? false,
      active: data.active ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
