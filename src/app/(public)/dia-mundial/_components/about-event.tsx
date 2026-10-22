import { CalendarDays, Globe2, Users } from "lucide-react";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";

const highlights = [
  {
    icon: Globe2,
    title: "Organizado por APTO y COTEOC",
    text: "La Asociación de Profesionales en Terapia Ocupacional y el Colegio de Terapeutas Ocupacionales de México celebran juntos el día en que la WFOT visibiliza a la profesión en todo el mundo.",
  },
  {
    icon: CalendarDays,
    title: DIA_MUNDIAL.dateLabel,
    text: "Durante cinco días abrimos de forma gratuita las conferencias, talleres y sesiones académicas que APTO y COTEOC han reunido en sus jornadas y congresos.",
  },
  {
    icon: Users,
    title: DIA_MUNDIAL.theme,
    text: "Participar es lo que sostiene a la profesión: en la clínica, en la comunidad, en la formación y en la vida de las asociaciones que nos representan.",
  },
];

export function AboutEvent() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
