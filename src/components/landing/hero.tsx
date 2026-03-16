"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LiquidGradient } from "@/components/landing/liquid-gradient";

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "90vh" }}>
      {/* Interactive liquid gradient background */}
      <LiquidGradient />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
            Impulsamos la{" "}
            <span className="text-green-300">Terapia Ocupacional</span> en
            M&eacute;xico
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-blue-100 sm:text-xl">
            Desde 1993 representamos a los profesionales de Terapia Ocupacional
            ante la WFOT. &Uacute;nete a la comunidad que fortalece tu
            profesi&oacute;n.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              render={<Link href="/membresia" />}
              className="bg-white text-brand-700 hover:bg-blue-50 font-bold shadow-lg"
            >
              Hazte Miembro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/nosotros" />}
              className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              Conoce m&aacute;s
            </Button>
          </div>
        </div>

        {/* WFOT Full Member Badge */}
        <div className="mt-16 flex items-center justify-center">
          <a
            href="https://wfot.org/member-organisations/mexico-asociacion-de-profesionales-en-terapia-ocupacional-ac"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:scale-105 duration-300"
          >
            <Image
              src="/logos/afiliaciones/wfot-full-member.png"
              alt="WFOT Full Member - Asociacion de Profesionales en Terapia Ocupacional AC"
              width={480}
              height={160}
              className="h-auto w-72 object-contain sm:w-96 drop-shadow-xl"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
