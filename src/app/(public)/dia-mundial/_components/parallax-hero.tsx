"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIA_MUNDIAL, type EventWindowStatus } from "@/lib/dia-mundial";
import { Countdown } from "./countdown";

/** Fracción del scroll que recorre la imagen: menor = más lento que la página. */
const PARALLAX_FACTOR = 0.2;
/** Margen extra (porcentaje del alto) que la imagen sobresale para no dejar huecos. */
const BLEED_PERCENT = 8;

interface ParallaxHeroProps {
  status: EventWindowStatus;
  registered: boolean;
}

export function ParallaxHero({ status, registered }: ParallaxHeroProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frameEl = frameRef.current;
    const layer = layerRef.current;
    if (!frameEl || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const maxShift = (frameEl.clientHeight * BLEED_PERCENT) / 100;
      const shift = Math.min(window.scrollY * PARALLAX_FACTOR, maxShift);
      layer.style.transform = `translate3d(0, ${shift}px, 0)`;
    };
    const onScroll = () => {
      if (raf === 0) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, []);

  const canRegister = status !== "closed" && !registered;

  return (
    <section className="bg-brand-900 text-white">
      {/* Banner oficial: ya incluye título, tema y fecha, por eso el h1 es solo para lectores de pantalla */}
      <h1 className="sr-only">
        {DIA_MUNDIAL.title} 2026: {DIA_MUNDIAL.theme}
      </h1>
      <div
        ref={frameRef}
        className="relative aspect-video max-h-[58svh] min-h-[200px] w-full overflow-hidden bg-[#dbe9f3]"
      >
        <div
          ref={layerRef}
          className="absolute inset-x-0 will-change-transform"
          style={{ top: `-${BLEED_PERCENT}%`, height: `${100 + BLEED_PERCENT}%` }}
        >
          <Image
            src={DIA_MUNDIAL.heroImage}
            alt={`${DIA_MUNDIAL.title}, 27 de octubre de 2026: ${DIA_MUNDIAL.theme}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Franja de acción: evento conjunto y registro */}
      <div className="bg-gradient-to-b from-brand-800 to-brand-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 px-4 py-10 text-center sm:px-6 sm:py-12">
          {status !== "closed" && <Countdown status={status} />}

          <div className="flex flex-col items-center gap-3">
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
              />
              <span aria-hidden="true" className="h-8 w-px bg-brand-100 sm:h-10" />
              <Image
                src={DIA_MUNDIAL.coteocLogo}
                alt={DIA_MUNDIAL.coteocName}
                width={240}
                height={86}
                className="h-9 w-auto sm:h-12"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              className="!border-white !bg-transparent !text-white hover:!bg-white/20"
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
