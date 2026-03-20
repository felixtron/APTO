import Image from "next/image";
import { GraduationCap, MapPin, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UniversidadesPage() {
  const universities = await prisma.university.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Universidades
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Instituciones educativas avaladas por APTO para estudiar Terapia
            Ocupacional en México
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {universities.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay universidades registradas aún.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((uni) => (
                <div
                  key={uni.id}
                  className="flex flex-col rounded-xl border p-6 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {uni.logoUrl ? (
                      <Image
                        src={uni.logoUrl}
                        alt={uni.shortName || uni.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                        <GraduationCap className="h-6 w-6 text-brand-500" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold">
                        {uni.shortName || uni.name}
                      </h2>
                      {uni.shortName && (
                        <p className="text-xs text-muted-foreground">
                          {uni.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {uni.description && (
                    <p className="mt-4 flex-1 text-sm text-muted-foreground">
                      {uni.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {uni.degrees.map((degree) => (
                      <Badge
                        key={degree}
                        variant="secondary"
                        className="bg-green-50 text-green-700"
                      >
                        {degree}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {uni.location}
                    </span>
                    {uni.website && (
                      <a
                        href={uni.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Sitio web
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
