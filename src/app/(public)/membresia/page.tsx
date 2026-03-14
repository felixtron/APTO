import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

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

const faqs = [
  {
    q: "¿Cómo me registro?",
    a: "Crea tu cuenta, realiza el pago en línea y tu membresía se activa inmediatamente.",
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
    a: "Sí, la membresía está abierta tanto a profesionales titulados como a estudiantes de Terapia Ocupacional.",
  },
];

export default function MembresiaPage() {
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

      {/* Plan */}
      <section className="bg-white">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
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
              render={<Link href="/auth/registro" />}
            >
              Inscribirse
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
