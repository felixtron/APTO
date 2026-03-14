import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const recordings = await prisma.recording.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(recordings);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const maxOrder = await prisma.recording.aggregate({
    _max: { displayOrder: true },
  });

  const recording = await prisma.recording.create({
    data: {
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      duration: data.duration ? parseInt(data.duration, 10) : null,
      eventTitle: data.eventTitle || null,
      category: data.category || null,
      active: data.active ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(recording, { status: 201 });
}
