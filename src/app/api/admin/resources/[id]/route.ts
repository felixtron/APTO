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

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      type: data.type || "PDF",
      fileUrl: data.fileUrl || null,
      externalUrl: data.externalUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      membersOnly: data.membersOnly ?? false,
      active: data.active ?? true,
      displayOrder: data.displayOrder ?? undefined,
    },
  });

  return NextResponse.json(resource);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
