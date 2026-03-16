import {
  Award,
  Globe,
  Newspaper,
  Briefcase,
  GraduationCap,
  Users,
} from "lucide-react";

const benefits = [
  {
    icon: Award,
    title: "Aval Profesional",
    description:
      "Respaldo académico para tu ejercicio profesional y posibilidad de aval para actividades académicas.",
  },
  {
    icon: Globe,
    title: "Red Internacional",
    description:
      "Membresía individual WFOT y participación activa con CLATO en 14 países latinoamericanos.",
  },
  {
    icon: Newspaper,
    title: "Boletín WFOT",
    description:
      "Recibe el boletín de la Federación Mundial de Terapeutas Ocupacionales con novedades internacionales.",
  },
  {
    icon: Briefcase,
    title: "Bolsa de Trabajo",
    description:
      "Acceso a ofertas laborales exclusivas difundidas por correo y redes sociales.",
  },
  {
    icon: GraduationCap,
    title: "Becas y Descuentos",
    description:
      "Promociones en acciones formativas desarrolladas y avaladas por APTO y organizaciones con convenio.",
  },
  {
    icon: Users,
    title: "Grupos de Trabajo",
    description:
      "Participa en comisiones y grupos para fortalecer la profesión y colaborar con colegas.",
  },
];

export function Benefits() {
  return (
    <section className="bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ¿Por qué ser miembro de APTO?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Beneficios que impulsan tu desarrollo profesional
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <benefit.icon className="h-5 w-5 text-brand-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
