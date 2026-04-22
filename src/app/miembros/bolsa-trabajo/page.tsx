import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getActiveMembership } from "@/lib/require-active-membership";
import { MembershipRequired } from "../_components/membership-required";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance",
};

const typeColors: Record<string, string> = {
  FULL_TIME: "bg-brand-50 text-brand-700",
  PART_TIME: "bg-amber-50 text-amber-700",
  CONTRACT: "bg-purple-50 text-purple-700",
  FREELANCE: "bg-green-50 text-green-700",
};

const tipos = [
  { value: undefined, label: "Todas" },
  { value: "FULL_TIME", label: "Tiempo completo" },
  { value: "PART_TIME", label: "Medio tiempo" },
  { value: "CONTRACT", label: "Contrato" },
  { value: "FREELANCE", label: "Freelance" },
] as const;

export default async function BolsaTrabajoMiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const membership = await getActiveMembership();
  if (!membership) redirect("/auth/login");
  if (!membership.isActive) {
    return (
      <MembershipRequired
        sectionTitle="Bolsa de Trabajo"
        sectionDescription="Oportunidades laborales para terapeutas ocupacionales"
        memberId={membership.userId}
        memberEmail={membership.email}
        memberType={membership.memberType}
        status={membership.status}
      />
    );
  }

  const search = await searchParams;
  const tipo = typeof search.tipo === "string" ? search.tipo : undefined;
  const pagina =
    typeof search.pagina === "string" ? parseInt(search.pagina) : 1;
  const page = isNaN(pagina) || pagina < 1 ? 1 : pagina;
  const PER_PAGE = 10;

  const where = {
    active: true,
    expiresAt: { gt: new Date() },
    ...(tipo ? { type: tipo as any } : {}),
  };

  const [jobs, totalCount] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bolsa de Trabajo</h1>
        <p className="text-sm text-muted-foreground">
          Oportunidades laborales para terapeutas ocupacionales
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tipos.map((t) => {
          const isActive = tipo === t.value;
          const href = t.value
            ? `/miembros/bolsa-trabajo?tipo=${t.value}`
            : "/miembros/bolsa-trabajo";
          return (
            <Link
              key={t.label}
              href={href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No hay ofertas laborales publicadas por el momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={typeColors[job.type]}
                    >
                      {typeLabels[job.type]}
                    </Badge>
                    {job.membersOnly && (
                      <Badge variant="secondary" className="bg-brand-50 text-brand-700">
                        Exclusiva miembros
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(job.createdAt, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{job.title}</h2>
                  <p className="mt-1 text-sm font-medium text-brand-500">
                    {job.company}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {job.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`mailto:${job.contactEmail}?subject=Interesado en: ${job.title}`}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Postularme
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          {page > 1 && (
            <Link
              href={`/miembros/bolsa-trabajo?${new URLSearchParams({
                ...(tipo ? { tipo } : {}),
                pagina: String(page - 1),
              }).toString()}`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/miembros/bolsa-trabajo?${new URLSearchParams({
                ...(tipo ? { tipo } : {}),
                pagina: String(page + 1),
              }).toString()}`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
