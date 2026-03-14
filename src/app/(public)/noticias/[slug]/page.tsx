import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const categoryColors: Record<string, string> = {
  NOTICIAS: "bg-brand-50 text-brand-700",
  EVENTOS: "bg-green-50 text-green-700",
  CLASIFICADOS: "bg-amber-50 text-amber-700",
};

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a noticias
        </Link>

        <div className="mt-8">
          {post.coverImage && (
            <div className="mb-8 aspect-video overflow-hidden rounded-xl">
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={categoryColors[post.category] || ""}
            >
              {post.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(post.createdAt, "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        </div>

        <div className="mt-8 border-t pt-8">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </div>
  );
}
