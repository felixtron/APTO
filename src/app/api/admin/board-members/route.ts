import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.boardMember.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const maxOrder = await prisma.boardMember.aggregate({
    _max: { displayOrder: true },
  });

  const member = await prisma.boardMember.create({
    data: {
      name: data.name,
      title: data.title,
      role: data.role || null,
      bio: data.bio || "",
      photoUrl: data.photoUrl || null,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
