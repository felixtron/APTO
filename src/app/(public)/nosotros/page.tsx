export const dynamic = "force-dynamic";

import { Award, Globe, Heart, Users } from "lucide-react";
import { FOUNDED_YEAR, CLATO_MEMBER_SINCE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const timeline = [
  {
    year: 1993,
    text: "Fundación de APTO como la primera asociación profesional de terapeutas ocupacionales en México.",
  },
  {
    year: 2010,
    text: "APTO se convierte en miembro oficial de la Confederación Latinoamericana de Terapia Ocupacional (CLATO).",
  },
  {
    year: 2016,
    text: "Reconocimiento como organización miembro de la World Federation of Occupational Therapists (WFOT).",
  },
  {
    year: 2023,
    text: "30 años impulsando la profesión. Más de 200 miembros activos en 14 países.",
  },
];

export default async function NosotrosPage() {
  const boardMembers = await prisma.boardMember.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Sobre APTO
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Desde {FOUNDED_YEAR}, la Asociación de Profesionales en Terapia
              Ocupacional impulsa el desarrollo de la profesión en México y
              Latinoamérica. Somos la voz de los terapeutas ocupacionales ante
              organismos internacionales.
            </p>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <Heart className="h-6 w-6 text-brand-500" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Misión</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Promover y fortalecer la Terapia Ocupacional en México,
                garantizando la representación profesional a nivel nacional e
                internacional, fomentando la educación continua, la
                investigación y la práctica basada en la evidencia.
              </p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Visión</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Ser la organización de referencia en México para los
                profesionales de Terapia Ocupacional, reconocida por su
                liderazgo en la formación, regulación y visibilidad de la
                profesión en el ámbito de la salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Afiliaciones */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Afiliaciones Internacionales
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-6 text-center">
              <Award className="mx-auto h-10 w-10 text-brand-500" />
              <h3 className="mt-4 text-lg font-semibold">WFOT</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                World Federation of Occupational Therapists. Organismo
                internacional que regula la profesión a nivel mundial.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 text-center">
              <Globe className="mx-auto h-10 w-10 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold">CLATO</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Confederación Latinoamericana de Terapia Ocupacional. Miembro
                desde {CLATO_MEMBER_SINCE}.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 text-center">
              <Users className="mx-auto h-10 w-10 text-purple-600" />
              <h3 className="mt-4 text-lg font-semibold">REMETO</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Red Mexicana de Terapia Ocupacional. Colaboración con
                instituciones educativas y de salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Nuestra Historia
          </h2>
          <div className="mx-auto mt-12 max-w-2xl space-y-8">
            {timeline.map((item) => (
              <div key={item.year} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {item.year}
                </div>
                <p className="mt-2 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mesa Directiva */}
      {boardMembers.length > 0 && (
        <section className="bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              Mesa Directiva
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {boardMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center rounded-xl border bg-white p-6 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                    <Users className="h-8 w-8 text-brand-400" />
                  </div>
                  <h3 className="mt-4 font-semibold">{member.name}</h3>
                  <p className="text-sm font-medium text-brand-500">
                    {member.title}
                  </p>
                  {member.role && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
