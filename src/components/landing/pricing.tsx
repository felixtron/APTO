import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const sharedFeatures = [
  "Membresía individual WFOT",
  "Acceso a sesiones en línea",
  "Video lecciones y materiales",
  "Descuentos especiales en eventos",
  "Bolsa de trabajo exclusiva",
  "Aval profesional APTO",
  "Participación activa en CLATO",
  "Boletín WFOT internacional",
  "Becas y descuentos en formación",
  "Grupos y comisiones de trabajo",
];

const plans = [
  {
    name: "Estudiante",
    price: "$300",
    period: "MXN / año",
    description: "Para estudiantes de Terapia Ocupacional",
    highlight: false,
  },
  {
    name: "Profesional",
    price: "$800",
    period: "MXN / año",
    description: "Para Terapeutas Ocupacionales titulados",
    highlight: true,
    badge: "Más popular",
  },
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

        <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 shadow-lg ${
                plan.highlight
                  ? "border-2 border-brand-500 ring-1 ring-brand-500"
                  : "border border-muted"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <div className="text-center">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {sharedFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
                render={<Link href="/membresia" />}
              >
                Inscribirse
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
