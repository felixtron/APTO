import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  NOTICIAS: "bg-brand-50 text-brand-700",
  EVENTOS: "bg-green-50 text-green-700",
  CLASIFICADOS: "bg-amber-50 text-amber-700",
};

const categories = [
  { value: undefined, label: "Todas" },
  { value: "NOTICIAS", label: "Noticias" },
  { value: "EVENTOS", label: "Eventos" },
  { value: "CLASIFICADOS", label: "Clasificados" },
] as const;

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = await searchParams;
  const categoria =
    typeof search.categoria === "string" ? search.categoria : undefined;
  const pagina =
    typeof search.pagina === "string" ? parseInt(search.pagina) : 1;
  const page = isNaN(pagina) || pagina < 1 ? 1 : pagina;
  const PER_PAGE = 9;

  const where = {
    published: true,
    ...(categoria ? { category: categoria as any } : {}),
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        coverImage: true,
        createdAt: true,
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Noticias
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Novedades del mundo de la Terapia Ocupacional
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex gap-2 mb-8">
            {categories.map((cat) => {
              const isActive = categoria === cat.value;
              const href = cat.value
                ? `/noticias?categoria=${cat.value}`
                : "/noticias";
              return (
                <Link
                  key={cat.label}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay noticias publicadas aún.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/noticias/${post.slug}`}
                  className="group rounded-xl border p-6 transition-all hover:shadow-md"
                >
                  {post.coverImage ? (
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
                      <div className="flex h-full items-center justify-center">
                        <span className="text-2xl font-bold text-brand-200">
                          APTO
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={categoryColors[post.category] || ""}
                    >
                      {post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(post.createdAt, "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-tight group-hover:text-brand-500">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/noticias?${new URLSearchParams({
                    ...(categoria ? { categoria } : {}),
                    pagina: String(page - 1),
                  }).toString()}`}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Anterior
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/noticias?${new URLSearchParams({
                    ...(categoria ? { categoria } : {}),
                    pagina: String(page + 1),
                  }).toString()}`}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
