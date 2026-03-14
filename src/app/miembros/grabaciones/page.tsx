export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
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
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Grabaciones</h1>
        <p className="text-muted-foreground">
          Biblioteca de videos exclusivos para miembros
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording) => (
            <Link
              key={recording.id}
              href={recording.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group cursor-pointer overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-video bg-gradient-to-br from-brand-100 to-brand-50">
                {recording.thumbnailUrl ? (
                  <Image
                    src={recording.thumbnailUrl}
                    alt={recording.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 text-brand-500" />
                    </div>
                  </div>
                )}
                {recording.duration && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    <Clock className="h-3 w-3" />
                    {recording.duration} min
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  {recording.category && (
                    <Badge
                      variant="secondary"
                      className={categoryColors[recording.category] || ""}
                    >
                      {recording.category}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(recording.createdAt, "MMM yyyy", { locale: es })}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-tight">
                  {recording.title}
                </h3>
                {recording.eventTitle && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recording.eventTitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
