"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIA_MUNDIAL, type EventWindowStatus } from "@/lib/dia-mundial";

/** Fracción del scroll que recorre la imagen: menor = más lento que la página. */
const PARALLAX_FACTOR = 0.35;

interface ParallaxHeroProps {
  status: EventWindowStatus;
  registered: boolean;
}

export function ParallaxHero({ status, registered }: ParallaxHeroProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      layer.style.transform = `translate3d(0, ${window.scrollY * PARALLAX_FACTOR}px, 0)`;
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  const canRegister = status !== "closed" && !registered;

  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden bg-brand-900 text-white">
      {/* Capa con imagen: más alta que la sección para que el desplazamiento no deje huecos */}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="absolute inset-x-0 -top-[40%] h-[140%] will-change-transform"
      >
        <Image
          src={DIA_MUNDIAL.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/85 via-brand-900/60 to-brand-900/85" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Evento conjunto */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
              Un evento conjunto de
            </span>
            <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-xl sm:gap-6 sm:px-8 sm:py-4">
              <Image
                src={DIA_MUNDIAL.aptoLogo}
                alt="APTO, Asociación de Profesionales en Terapia Ocupacional"
                width={140}
                height={48}
                className="h-9 w-auto sm:h-12"
                priority
              />
              <span aria-hidden="true" className="h-8 w-px bg-brand-100 sm:h-10" />
              <Image
                src={DIA_MUNDIAL.coteocLogo}
                alt={DIA_MUNDIAL.coteocName}
                width={240}
                height={86}
                className="h-9 w-auto sm:h-12"
                priority
              />
            </div>
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
            {DIA_MUNDIAL.title}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-green-300 sm:text-3xl">
            &ldquo;{DIA_MUNDIAL.theme}&rdquo;
          </p>

          {/* CTA principal: registro gratuito */}
          <div className="mt-10 flex flex-col items-center gap-3">
            {canRegister ? (
              <>
                <a
                  href="#registro"
                  className="inline-flex items-center gap-3 rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-green-900/40 ring-4 ring-white/20 transition hover:bg-green-400 hover:ring-white/40 focus:outline-none focus-visible:ring-white sm:px-10 sm:py-5 sm:text-xl"
                >
                  <UserPlus className="h-6 w-6" />
                  Registro gratuito
                  <ArrowRight className="h-5 w-5" />
                </a>
                <p className="text-sm text-blue-100">
                  {DIA_MUNDIAL.dateLabel} · Sin costo y sin membresía
                </p>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-base font-medium backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                {status === "closed"
                  ? "Gracias por participar"
                  : `Ya estás registrado · ${DIA_MUNDIAL.dateLabel}`}
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {status === "open" && registered && (
              <Button
                size="lg"
                className="bg-white font-bold text-brand-700 shadow-lg hover:bg-blue-50"
                render={<a href="#grabaciones" />}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Ver grabaciones
              </Button>
            )}
            <Button
              size="lg"
              render={<Link href="/membresia" />}
              className="!border-white !bg-transparent !text-white backdrop-blur-sm hover:!bg-white/20"
            >
              Únete a APTO
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
