export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Award, Video } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MembershipCta } from "./membership-cta";

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Activa", className: "bg-green-100 text-green-800" },
  EXPIRED: { label: "Expirada", className: "bg-red-100 text-red-800" },
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "Cancelada", className: "bg-gray-100 text-gray-800" },
};

const typeLabels: Record<string, string> = {
  PROFESSIONAL: "Profesional",
};

export default async function MiembrosDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = await searchParams;
  const checkoutSuccess = search.checkout === "success";

  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const memberId = session.user.id;

  const [member, certificateCount, recordingCount, nextEvent] =
    await Promise.all([
      prisma.member.findUnique({
        where: { id: memberId },
        select: {
          status: true,
          type: true,
          subscriptionEnd: true,
          name: true,
          email: true,
        },
      }),
      prisma.certificate.count({ where: { memberId } }),
      prisma.recording.count({ where: { active: true } }),
      prisma.event.findFirst({
        where: { active: true, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        select: { title: true, scheduledAt: true },
      }),
    ]);

  if (!member) redirect("/auth/login");

  const status = statusConfig[member.status] ?? statusConfig.PENDING;
  const memberType = typeLabels[member.type] ?? member.type;

  const subscriptionEndFormatted = member.subscriptionEnd
    ? format(member.subscriptionEnd, "d MMM yyyy", { locale: es })
    : "Sin fecha";

  const isPaymentCurrent =
    member.subscriptionEnd && member.subscriptionEnd > new Date();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold sm:text-2xl">
          Bienvenido, {member.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">Tu portal de miembro APTO</p>
      </div>

      {checkoutSuccess && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ¡Pago exitoso! Tu membresía ha sido activada. Recibirás un correo de confirmación.
          </p>
        </div>
      )}

      {/* Status card */}
      <div className="mb-8 rounded-xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Estado de membresía
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={status.className}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">
                {memberType}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vence</p>
            <p className="text-sm font-medium">{subscriptionEndFormatted}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <Badge variant="secondary">{memberType}</Badge>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MembershipCta
          memberId={memberId}
          memberEmail={member.email}
          memberType={member.type}
          status={member.status}
          subscriptionEnd={member.subscriptionEnd?.toISOString() ?? null}
        />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo evento
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <>
                <p className="text-lg font-bold">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(nextEvent.scheduledAt, "d MMM yyyy", { locale: es })}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">Sin eventos</p>
                <p className="text-xs text-muted-foreground">
                  Sin eventos próximos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {isPaymentCurrent ? "Al corriente" : "Pendiente"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPaymentCurrent
                ? `Vence: ${subscriptionEndFormatted}`
                : "Suscripción vencida"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Constancias
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{certificateCount}</p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grabaciones
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{recordingCount}</p>
            <p className="text-xs text-muted-foreground">
              Videos disponibles
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
