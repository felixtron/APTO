export const dynamic = "force-dynamic";

import {
  Award,
  Globe,
  Target,
  Megaphone,
  Heart,
  Handshake,
  Users,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { FOUNDED_YEAR, CLATO_MEMBER_SINCE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

const objetivos = [
  {
    icon: Megaphone,
    text: "Dar a conocer la profesión en el ambiente médico y afines",
  },
  {
    icon: Heart,
    text: "Informar a la sociedad sobre los beneficios y ayuda que brinda la Terapia Ocupacional",
  },
  {
    icon: MapPin,
    text: "Hacer patente la presencia de los terapeutas ocupacionales mexicanos en diferentes foros a nivel nacional e internacional",
  },
  {
    icon: Handshake,
    text: "Orientación y asistencia a personas de bajos recursos",
  },
  {
    icon: Users,
    text: "Trabajo conjunto con asociaciones afines",
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

      {/* Objetivos */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <Target className="h-6 w-6 text-brand-500" />
            </div>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Nuestros Objetivos
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-6">
            {objetivos.map((obj, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <obj.icon className="h-5 w-5 text-brand-500" />
                </div>
                <p className="text-muted-foreground leading-relaxed pt-1.5">
                  {obj.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
                Un camino de retos
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Nuestra Historia
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                Somos una asociación civil fundada en 1993 por un grupo de
                terapeutas ocupacionales mexicanos con la finalidad de reunir a
                todo el talento de esta área y difundir el valor de la
                ocupación, para obtener actualización profesional y buscar la
                identidad, reconocimiento e independencia que gozan los
                terapeutas ocupacionales en todo el mundo.
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Miembros de la WFOT</p>
                    <p className="text-sm text-muted-foreground">
                      World Federation of Occupational Therapists &mdash; Es la
                      voz mundial de la terapia ocupacional y establece el
                      estándar para su práctica.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Miembros de CLATO desde {CLATO_MEMBER_SINCE}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confederación Latinoamericana de Terapia Ocupacional.
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-lg font-medium text-brand-600">
                Representamos a terapeutas que están preparando vidas para vivir.
              </p>
            </div>
            {/* Photo placeholder */}
            <div className="flex items-center justify-center">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Foto de APTO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mesa Directiva */}
      {boardMembers.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              Mesa Directiva
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Conoce a las personas que lideran nuestra asociación.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {boardMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center rounded-xl border bg-white p-6 text-center shadow-sm"
                >
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      width={120}
                      height={120}
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-brand-50"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-50 ring-4 ring-brand-100">
                      <Users className="h-12 w-12 text-brand-400" />
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm font-medium text-brand-500">
                    {member.title}
                  </p>
                  {member.role && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  )}
                  {member.bio && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {member.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Organigrama */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Organigrama
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Estructura organizacional de APTO.
          </p>
          <div className="mt-12 flex items-center justify-center">
            <div className="flex aspect-[16/9] w-full max-w-4xl items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Organigrama
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Galería
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Momentos que nos definen como asociación.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
              >
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-xs text-gray-500">Imagen {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
