export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function EventoEspecialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await prisma.specialEvent.findUnique({
    where: { slug },
  });

  if (!event) notFound();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <CalendarDays className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {event.title}
          </h1>
          {event.description && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          )}
          {event.registrationUrl && (
            <div className="mt-8">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-700"
              >
                Registro al Evento
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Program Image */}
      {event.programImage && (
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-2xl font-bold">Programa</h2>
            <div className="relative overflow-hidden rounded-2xl border shadow-lg">
              <Image
                src={event.programImage}
                alt={`Programa - ${event.title}`}
                width={1200}
                height={1600}
                className="w-full"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* CTA bottom */}
      {event.registrationUrl && (
        <section className="bg-green-50">
          <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
            <p className="text-lg font-medium text-green-800">
              ¡No te lo pierdas!
            </p>
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-700"
            >
              Registrarme ahora
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
