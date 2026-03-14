import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  // Check if title changed to regenerate slug
  const existing = await prisma.post.findUnique({ where: { id } });
  const slug =
    data.title && data.title !== existing?.title
      ? slugify(data.title)
      : undefined;

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      ...(slug ? { slug } : {}),
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage ?? undefined,
      category: data.category ?? undefined,
      published: data.published ?? undefined,
      featured: data.featured ?? undefined,
      publishedAt:
        data.published && !existing?.publishedAt ? new Date() : undefined,
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
