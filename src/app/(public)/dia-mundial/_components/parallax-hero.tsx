"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIA_MUNDIAL, type EventWindowStatus } from "@/lib/dia-mundial";

/** Fracción del scroll que recorre la imagen: menor = más lento que la página. */
const PARALLAX_FACTOR = 0.35;

const STATUS_LABEL: Record<EventWindowStatus, string> = {
  upcoming: "Próximamente · acceso libre",
  open: "Acceso libre abierto",
  closed: "Gracias por participar",
};

interface ParallaxHeroProps {
  status: EventWindowStatus;
}

export function ParallaxHero({ status }: ParallaxHeroProps) {
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

  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden bg-brand-900 text-white">
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-green-300" />
            {DIA_MUNDIAL.dateLabel} · {STATUS_LABEL[status]}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
            {DIA_MUNDIAL.title}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-green-300 sm:text-3xl">
            &ldquo;{DIA_MUNDIAL.theme}&rdquo;
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100">
            Celebramos el Día Mundial de la Terapia Ocupacional abriendo
            nuestra biblioteca de conferencias a toda la comunidad. Participa,
            aprende y súmate a la asociación que representa a la profesión en
            México.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {status === "open" && (
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
              className={
                status === "open"
                  ? "!border-white !bg-transparent !text-white backdrop-blur-sm hover:!bg-white/20"
                  : "bg-white font-bold text-brand-700 shadow-lg hover:bg-blue-50"
              }
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
