"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function CtaFinal() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "professional" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-500">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Únete a la comunidad de terapeutas ocupacionales más grande de
            México
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Más de 200 profesionales ya forman parte de APTO. Fortalece tu
            carrera con respaldo internacional.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-brand-600 hover:bg-white/90"
              disabled={loading}
              onClick={handleCheckout}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Hazte Miembro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              size="lg"
              render={<Link href="/contacto" />}
              className="!border-white !text-white !bg-transparent hover:!bg-white/20"
            >
              Contáctanos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
