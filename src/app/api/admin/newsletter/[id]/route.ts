import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Get single newsletter
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const newsletter = await prisma.newsletter.findUnique({ where: { id } });

  if (!newsletter) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(newsletter);
}

// Update newsletter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { subject, content } = await request.json();

  const newsletter = await prisma.newsletter.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(content !== undefined && { content }),
    },
  });

  return NextResponse.json(newsletter);
}

// Delete newsletter
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const newsletter = await prisma.newsletter.findUnique({ where: { id } });
  if (newsletter?.status === "SENT") {
    return NextResponse.json(
      { error: "No se puede eliminar un boletín ya enviado" },
      { status: 400 }
    );
  }

  await prisma.newsletter.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
