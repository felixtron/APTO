"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";

const features = [
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
    plan: "student" as const,
    price: "$300",
    period: "MXN / año",
    description: "Para estudiantes de Terapia Ocupacional",
    highlight: false,
  },
  {
    name: "Profesional",
    plan: "professional" as const,
    price: "$800",
    period: "MXN / año",
    description: "Para Terapeutas Ocupacionales titulados",
    highlight: true,
    badge: "Más popular",
  },
];

const faqs = [
  {
    q: "¿Cómo me registro?",
    a: "Selecciona tu plan, realiza el pago en línea y completa tu registro. Tu membresía se activa inmediatamente.",
  },
  {
    q: "¿La membresía se renueva automáticamente?",
    a: "Sí, la membresía se renueva anualmente de forma automática. Puedes cancelar en cualquier momento desde tu portal de miembro.",
  },
  {
    q: "¿Qué incluye la membresía WFOT?",
    a: "Como miembro de APTO, automáticamente eres miembro individual de la WFOT, lo que te da acceso a recursos internacionales, directorio mundial y eventos globales.",
  },
  {
    q: "¿Pueden inscribirse estudiantes?",
    a: "Sí, la membresía está abierta tanto a profesionales titulados como a estudiantes de Terapia Ocupacional. Los estudiantes cuentan con una tarifa preferencial de $300 MXN al año.",
  },
];

export default function MembresiaPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: "student" | "professional") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Hazte Miembro de APTO
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Invierte en tu desarrollo profesional y forma parte de la
              comunidad de terapeutas ocupacionales más grande de México
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2">
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
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  disabled={loadingPlan !== null}
                  onClick={() => handleCheckout(plan.plan)}
                >
                  {loadingPlan === plan.plan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Pagar y Registrarse
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Preguntas Frecuentes
          </h2>
          <div className="mt-12 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border bg-white p-6">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
