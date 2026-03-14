export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Award, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "./download-button";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "Vigente", variant: "default" },
  EXPIRED: { label: "Expirado", variant: "secondary" },
  REVOKED: { label: "Revocado", variant: "destructive" },
};

export default async function ConstanciasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { status: true, memberNumber: true },
  });

  const certificates = await prisma.certificate.findMany({
    where: { memberId: session.user.id },
    orderBy: { issuedAt: "desc" },
  });

  const isActive = member?.status === "ACTIVE";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Constancias</h1>
        <p className="text-muted-foreground">
          Descarga tus constancias de membresía verificables
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
              className="flex items-center justify-between rounded-xl border bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Award className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {cert.type === "membership"
                        ? "Constancia de Membresía"
                        : cert.type}
                    </h3>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{cert.year}</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {cert.certificateId}
                    </span>
                  </div>
                </div>
              </div>
              {cert.status === "ACTIVE" ? (
                <DownloadButton certificateId={cert.id} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No disponible
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
