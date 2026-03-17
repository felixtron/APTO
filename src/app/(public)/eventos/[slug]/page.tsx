export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EventRegistration } from "./event-registration";
import { RegistroBanner } from "./registro-banner";

const modalityLabels: Record<string, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
};

function formatPrice(centavos: number) {
  return centavos === 0
    ? "Gratis"
    : `$${(centavos / 100).toLocaleString()} MXN`;
}

export default async function EventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const registro = typeof search.registro === "string" ? search.registro : undefined;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });

  if (!event || !event.active) {
    notFound();
  }

  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.registrations
    : null;

  const prices = {
    student: event.priceStudent,
    teacher: event.price,
    professional: event.priceProfessional,
  };

  const allFree = prices.student === 0 && prices.teacher === 0 && prices.professional === 0;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <RegistroBanner registro={registro} />

        <Link
          href="/eventos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a eventos
        </Link>

        <div className="mt-8">
          {event.coverImage && (
            <div className="mb-8 aspect-video overflow-hidden rounded-xl">
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <Badge variant="secondary">{modalityLabels[event.modality]}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {event.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(event.scheduledAt, "d 'de' MMMM 'de' yyyy, HH:mm", {
                locale: es,
              })}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
            {event.maxCapacity && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {spotsLeft !== null && spotsLeft > 0
                  ? `${spotsLeft} lugares disponibles`
                  : spotsLeft === 0
                    ? "Sin lugares disponibles"
                    : `${event.maxCapacity} lugares`}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border bg-muted/30 p-6">
            {allFree ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-2xl font-bold">Gratuito</p>
                </div>
                <EventRegistration
                  eventId={event.id}
                  eventTitle={event.title}
                  prices={prices}
                  spotsLeft={spotsLeft}
                  eventSlug={event.slug}
                />
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm font-medium text-muted-foreground">Precios</p>
                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border bg-white p-3 text-center">
                    <p className="text-xs text-muted-foreground">Estudiante</p>
                    <p className="text-lg font-bold">{formatPrice(prices.student)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 text-center">
                    <p className="text-xs text-muted-foreground">Maestro</p>
                    <p className="text-lg font-bold">{formatPrice(prices.teacher)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 text-center">
                    <p className="text-xs text-muted-foreground">Profesional</p>
                    <p className="text-lg font-bold">{formatPrice(prices.professional)}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <EventRegistration
                    eventId={event.id}
                    eventTitle={event.title}
                    prices={prices}
                    spotsLeft={spotsLeft}
                    eventSlug={event.slug}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </div>
      </div>
    </div>
  );
}
