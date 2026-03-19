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

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: slugify(data.title),
      excerpt: data.excerpt || "",
      content: data.content || "",
      coverImage: data.coverImage || null,
      category: data.category || "NOTICIAS",
      published: data.published ?? false,
      featured: data.featured ?? false,
      source: data.source || "MANUAL",
      publishedAt: data.published ? new Date() : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
