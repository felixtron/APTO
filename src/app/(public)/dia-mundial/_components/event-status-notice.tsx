import Link from "next/link";
import { CalendarClock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIA_MUNDIAL, type EventWindowStatus } from "@/lib/dia-mundial";

interface EventStatusNoticeProps {
  status: Exclude<EventWindowStatus, "open">;
}

export function EventStatusNotice({ status }: EventStatusNoticeProps) {
  const isUpcoming = status === "upcoming";
  const Icon = isUpcoming ? CalendarClock : Lock;

  return (
    <section id="grabaciones" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Icon className="h-7 w-7 text-brand-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
          {isUpcoming
            ? "Las grabaciones se abren el 27 de octubre"
            : "El acceso libre terminó"}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {isUpcoming
            ? `${DIA_MUNDIAL.dateLabel} podrás ver gratis todas las conferencias de nuestra biblioteca. Vuelve pronto o únete a APTO para tener acceso permanente.`
            : "Gracias por acompañarnos en el Día Mundial de la Terapia Ocupacional. Los miembros de APTO conservan acceso permanente a la biblioteca completa."}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/membresia" />}>
            Hazte miembro
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/auth/login" />}>
            Ya soy miembro
          </Button>
        </div>
      </div>
    </section>
  );
}
