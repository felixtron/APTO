import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const features = [
  "Membresía individual WFOT",
  "Acceso a sesiones en línea",
  "Video lecciones y materiales",
  "Descuentos especiales en eventos",
  "Bolsa de trabajo exclusiva",
  "Aval profesional APTO",
  "Participación activa en CLATO",
  "Artículo científico DMCN mensual",
  "Becas y descuentos en formación",
  "Grupos y comisiones de trabajo",
];

export function Pricing() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Membresía Anual
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Invierte en tu desarrollo profesional
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="relative rounded-2xl border border-brand-500 p-8 shadow-lg ring-1 ring-brand-500">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
              Membresía APTO
            </span>
            <div className="text-center">
              <div className="mt-4">
                <span className="text-5xl font-bold">$800</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  MXN / año
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Para Terapeutas Ocupacionales titulados y en formación
              </p>
            </div>
            <ul className="mt-8 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-8 w-full"
              size="lg"
              render={<Link href="/membresia" />}
            >
              Inscribirse
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
