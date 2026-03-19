import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Lock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

const modalityLabels: Record<string, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
};

const modalityColors: Record<string, string> = {
  VIRTUAL: "bg-blue-50 text-blue-700",
  IN_PERSON: "bg-green-50 text-green-700",
  HYBRID: "bg-purple-50 text-purple-700",
};

function getPriceBadge(event: { price: number; priceStudent: number; priceProfessional: number }) {
  const prices = [event.priceStudent, event.price, event.priceProfessional];
  const allFree = prices.every((p) => p === 0);
  if (allFree) return { label: "Gratuito", className: "bg-green-50 text-green-700" };

  const nonZero = prices.filter((p) => p > 0);
  const min = Math.min(...nonZero);
  return {
    label: `Desde $${(min / 100).toLocaleString()} MXN`,
    className: "",
  };
}

export default async function EventosPage() {
  const events = await prisma.event.findMany({
    where: { active: true },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      scheduledAt: true,
      modality: true,
      location: true,
      price: true,
      priceStudent: true,
      priceProfessional: true,
      membersOnly: true,
    },
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Eventos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Congresos, talleres y jornadas profesionales
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay eventos programados por el momento.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {events.map((event) => {
                const priceBadge = getPriceBadge(event);
                return (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.slug}`}
                    className="group rounded-xl border p-6 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center rounded-lg bg-brand-50 px-3 py-2">
                        <span className="text-xs font-medium text-brand-500">
                          {format(event.scheduledAt, "MMM", { locale: es }).toUpperCase()}
                        </span>
                        <span className="text-xl font-bold text-brand-600">
                          {format(event.scheduledAt, "d")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={modalityColors[event.modality]}
                        >
                          {modalityLabels[event.modality]}
                        </Badge>
                        <Badge variant="secondary" className={priceBadge.className}>
                          {priceBadge.label}
                        </Badge>
                        {event.membersOnly && (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                            <Lock className="mr-1 h-3 w-3" />
                            Solo miembros
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold group-hover:text-brand-500">
                      {event.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    {event.location && (
                      <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
