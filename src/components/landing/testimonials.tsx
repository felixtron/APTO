"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "La iniciativa de un grupo de profesionales de promover a la Terapia Ocupacional a nivel nacional e internacional dio fruto con la creación de APTO.",
    name: "LTO. María Teresa Morales Lozano",
    role: "Presidenta Fundadora, 1993",
  },
  {
    quote:
      "27 años de crecimiento profesional y unidad organizacional. APTO ha sido el puente para que los terapeutas ocupacionales mexicanos tengan voz internacional.",
    name: "LTO. Helvia del Carmen Cascajares Díaz",
    role: "Secretaria Fundadora, 1993",
  },
  {
    quote:
      "A través de APTO hemos logrado roles de liderazgo y colaboración internacional en acreditación y políticas públicas de salud.",
    name: "LTO. Juana Isabel Campos Flores",
    role: "2a Presidenta de APTO",
  },
  {
    quote:
      "La membresía en APTO ha enriquecido mi desarrollo personal y profesional de maneras que no imaginé posibles.",
    name: "T.O. J. G. Guillermo Martínez Ventura",
    role: "Secretario 1995, Presidente 2003",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const prev = () =>
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () =>
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  const t = testimonials[current];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Voces de Nuestros Fundadores
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="relative rounded-2xl bg-muted/50 p-8 sm:p-12">
            <Quote className="absolute left-6 top-6 h-8 w-8 text-brand-100 sm:left-8 sm:top-8" />
            <blockquote className="relative">
              <p className="text-lg leading-relaxed text-foreground sm:text-xl">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-6">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </footer>
            </blockquote>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current
                      ? "w-6 bg-brand-500"
                      : "w-2 bg-border hover:bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
