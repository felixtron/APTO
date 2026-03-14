import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// List all newsletters
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newsletters = await prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(newsletters);
}

// Create a new newsletter
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, content } = await request.json();

  if (!subject || !content) {
    return NextResponse.json(
      { error: "Asunto y contenido son requeridos" },
      { status: 400 }
    );
  }

  const newsletter = await prisma.newsletter.create({
    data: { subject, content, status: "DRAFT" },
  });

  return NextResponse.json(newsletter);
}
