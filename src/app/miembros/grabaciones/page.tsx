export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  Congresos: "bg-brand-50 text-brand-700",
  Seminarios: "bg-purple-50 text-purple-700",
  Conferencias: "bg-green-50 text-green-700",
  Talleres: "bg-amber-50 text-amber-700",
};

export default async function GrabacionesPage() {
  const recordings = await prisma.recording.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  // Group recordings by eventTitle
  const grouped = new Map<string, typeof recordings>();
  for (const rec of recordings) {
    const key = rec.eventTitle || "Otras grabaciones";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Grabaciones</h1>
        <p className="text-muted-foreground">
          Biblioteca de conferencias y sesiones exclusivas para miembros
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
          <Play className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay grabaciones disponibles
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([eventTitle, recs]) => (
            <section key={eventTitle}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold">{eventTitle}</h2>
                <Badge variant="secondary" className="text-xs">
                  {recs.length} {recs.length === 1 ? "grabación" : "grabaciones"}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recs.map((recording) => (
                  <Link
                    key={recording.id}
                    href={recording.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 transition-transform group-hover:scale-110">
                      <Play className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium leading-tight line-clamp-2">
                        {recording.title}
                      </h3>
                      {recording.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {recording.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {recording.category && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${categoryColors[recording.category] || ""}`}
                          >
                            {recording.category}
                          </Badge>
                        )}
                        {recording.duration && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {recording.duration} min
                          </span>
                        )}
                        <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
