import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const affiliations = [
  { name: "WFOT", src: "/logos/afiliaciones/wfot.png", width: 120 },
  { name: "CLATO", src: "/logos/afiliaciones/clato.png", width: 120 },
  { name: "REMETO", src: "/logos/afiliaciones/remeto.png", width: 120 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Impulsamos la{" "}
            <span className="text-brand-500">Terapia Ocupacional</span> en
            México
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Desde 1993 representamos a los profesionales de Terapia Ocupacional
            ante la WFOT y CLATO. Únete a la comunidad que fortalece tu
            profesión.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" render={<Link href="/membresia" />}>
              Hazte Miembro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/nosotros" />}>
              Conoce más
            </Button>
          </div>
        </div>

        {/* Logos de afiliaciones */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-10 sm:gap-14">
          {affiliations.map((org) => (
            <Image
              key={org.name}
              src={org.src}
              alt={org.name}
              width={org.width}
              height={48}
              className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
