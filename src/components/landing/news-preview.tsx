import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

const categoryColors: Record<string, string> = {
  NOTICIAS: "bg-brand-50 text-brand-700",
  EVENTOS: "bg-green-50 text-green-700",
  CLASIFICADOS: "bg-amber-50 text-amber-700",
};

export async function NewsPreview() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      coverImage: true,
      createdAt: true,
    },
  });

  if (posts.length === 0) {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Últimas Noticias
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Novedades del mundo de la Terapia Ocupacional
              </p>
            </div>
          </div>
          <p className="mt-10 text-center text-lg text-muted-foreground">
            Próximamente noticias y novedades
          </p>
        </div>
      </section>
    );
  }

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Últimas Noticias
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Novedades del mundo de la Terapia Ocupacional
            </p>
          </div>
          <Button variant="ghost" className="hidden sm:flex" render={<Link href="/noticias" />}>
            Ver todas
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          {/* Featured post */}
          <Link
            href={`/noticias/${featured.slug}`}
            className="group lg:col-span-3"
          >
            <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-50">
              {featured.coverImage ? (
                <Image
                  src={featured.coverImage}
                  alt={featured.title}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl font-bold text-brand-200">APTO</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={categoryColors[featured.category]}
                >
                  {featured.category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(featured.createdAt, "d MMM yyyy", { locale: es })}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-semibold group-hover:text-brand-500">
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-muted-foreground">
                {featured.excerpt}
              </p>
            </div>
          </Link>

          {/* Rest */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/noticias/${post.slug}`}
                className="group flex gap-4 border-b pb-6 last:border-0"
              >
                {/* Thumbnail */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-lg font-bold text-brand-200">A</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        categoryColors[post.category] || ""
                      )}
                    >
                      {post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(post.createdAt, "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug group-hover:text-brand-500 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" render={<Link href="/noticias" />}>
            Ver todas las noticias
          </Button>
        </div>
      </div>
    </section>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
