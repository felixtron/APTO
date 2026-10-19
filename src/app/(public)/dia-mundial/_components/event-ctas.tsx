import Link from "next/link";
import { ArrowRight, ExternalLink, GraduationCap, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";
import {
  MEMBERSHIP_PRICE_PROFESSIONAL,
  MEMBERSHIP_PRICE_STUDENT,
} from "@/lib/constants";

function formatMxn(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-MX")} MXN`;
}

export function EventCtas() {
  const showColegio = DIA_MUNDIAL.colegioUrl.length > 0;

  return (
    <section className="bg-brand-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-300">
            {DIA_MUNDIAL.theme}
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Participa en tu profesión
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            La terapia ocupacional crece cuando sus profesionales se organizan.
            Súmate a la asociación y al colegio que te representan.
          </p>
        </div>

        <div
          className={`mx-auto mt-12 grid gap-6 ${showColegio ? "max-w-4xl md:grid-cols-2" : "max-w-xl"}`}
        >
          <article className="flex flex-col rounded-2xl bg-white p-8 text-foreground shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <HeartHandshake className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-5 text-xl font-bold">Únete a APTO</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Acceso permanente a la biblioteca de grabaciones, constancias,
              directorio profesional, bolsa de trabajo y representación ante la
              WFOT. Membresía anual desde{" "}
              {formatMxn(MEMBERSHIP_PRICE_STUDENT)} para estudiantes y{" "}
              {formatMxn(MEMBERSHIP_PRICE_PROFESSIONAL)} para profesionales.
            </p>
            <Button size="lg" className="mt-6 w-full" render={<Link href="/membresia" />}>
              Hazte miembro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </article>

          {showColegio && (
            <article className="flex flex-col rounded-2xl bg-white p-8 text-foreground shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Únete al Colegio</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                El colegio profesional fortalece la certificación, la ética y
                el reconocimiento de la terapia ocupacional en México. Conoce
                los requisitos y colégiate.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="mt-6 w-full"
                render={
                  <a
                    href={DIA_MUNDIAL.colegioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Conocer el Colegio
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
