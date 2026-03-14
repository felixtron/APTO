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

  const recording = await prisma.recording.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      duration: data.duration ? parseInt(data.duration, 10) : null,
      eventTitle: data.eventTitle || null,
      category: data.category || null,
      active: data.active ?? undefined,
      displayOrder: data.displayOrder ?? undefined,
    },
  });

  return NextResponse.json(recording);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.recording.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
