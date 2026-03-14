import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaFinal() {
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
              render={<Link href="/membresia" />}
            >
              Hazte Miembro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              render={<Link href="/contacto" />}
            >
              Contáctanos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
