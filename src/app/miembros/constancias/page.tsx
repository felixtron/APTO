export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Award, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "./download-button";
import { getActiveMembership } from "@/lib/require-active-membership";
import { MembershipRequired } from "../_components/membership-required";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "Vigente", variant: "default" },
  EXPIRED: { label: "Expirado", variant: "secondary" },
  REVOKED: { label: "Revocado", variant: "destructive" },
};

export default async function ConstanciasPage() {
  const membership = await getActiveMembership();
  if (!membership) redirect("/auth/login");
  if (!membership.isActive) {
    return (
      <MembershipRequired
        sectionTitle="Constancias"
        sectionDescription="Descarga tus constancias de membresía y capacitación verificables"
        memberId={membership.userId}
        memberEmail={membership.email}
        memberType={membership.memberType}
        status={membership.status}
      />
    );
  }

  const member = await prisma.member.findUnique({
    where: { id: membership.userId },
    select: { status: true, memberNumber: true },
  });

  const certificates = await prisma.certificate.findMany({
    where: { memberId: membership.userId },
    orderBy: { issuedAt: "desc" },
    include: { event: { select: { title: true } } },
  });

  const isActive = member?.status === "ACTIVE";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Constancias</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Descarga tus constancias de membresía y capacitación verificables
        </p>
        {member?.memberNumber && (
          <p className="mt-1 text-sm text-muted-foreground">
            Número de socio:{" "}
            <span className="font-medium text-foreground">
              {member.memberNumber}
            </span>
          </p>
        )}
      </div>

      {!isActive && certificates.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          No tienes constancias disponibles. Activa tu membresía para obtener
          tu constancia.
        </div>
      )}

      {isActive && certificates.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          Tus constancias aparecerán aquí cuando se generen.
        </div>
      )}

      <div className="space-y-3">
        {certificates.map((cert) => {
          const st = statusLabels[cert.status] ?? statusLabels.ACTIVE;
          return (
            <div
              key={cert.id}
              className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Award className="h-5 w-5 text-brand-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold sm:text-base">
                      {cert.type === "membership"
                        ? "Constancia de Membresía"
                        : cert.type === "training"
                          ? "Constancia de Capacitación"
                          : cert.type}
                    </h3>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  {cert.event && (
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      {cert.event.title}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                    <span>{cert.year}</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {cert.certificateId}
                    </span>
                  </div>
                </div>
              </div>
              <div className="self-end sm:self-auto">
                {cert.status === "ACTIVE" ? (
                  <DownloadButton certificateId={cert.id} />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No disponible
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
