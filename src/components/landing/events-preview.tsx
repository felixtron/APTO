import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

const modalityLabels = {
  VIRTUAL: "Virtual",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
};

const modalityColors = {
  VIRTUAL: "bg-blue-50 text-blue-700",
  IN_PERSON: "bg-green-50 text-green-700",
  HYBRID: "bg-purple-50 text-purple-700",
};

export async function EventsPreview() {
  const events = await prisma.event.findMany({
    where: { active: true, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      scheduledAt: true,
      modality: true,
      location: true,
    },
  });

  return (
    <section className="bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Próximos Eventos
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Congresos, talleres y jornadas profesionales
            </p>
          </div>
          <Button variant="ghost" className="hidden sm:flex" render={<Link href="/eventos" />}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {events.length === 0 ? (
          <p className="mt-10 text-center text-lg text-muted-foreground">
            Próximamente nuevos eventos
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/eventos/${event.slug}`}
                className="group rounded-xl border bg-white p-6 transition-all hover:shadow-md"
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
                  <Badge
                    variant="secondary"
                    className={modalityColors[event.modality]}
                  >
                    {modalityLabels[event.modality]}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold group-hover:text-brand-500">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {event.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" render={<Link href="/eventos" />}>
            Ver todos los eventos
          </Button>
        </div>
      </div>
    </section>
  );
}
