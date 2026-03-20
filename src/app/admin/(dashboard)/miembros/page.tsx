export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Suspense } from "react";
import { MemberActions } from "./member-actions";
import { MemberSearch } from "./member-search";
import { CreateMemberForm } from "./create-member-form";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

const PAGE_SIZE = 20;

export default async function AdminMiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const buscar =
    typeof params.buscar === "string" ? params.buscar : undefined;
  const estado =
    typeof params.estado === "string" ? params.estado : undefined;
  const pagina =
    typeof params.pagina === "string" ? parseInt(params.pagina, 10) : 1;
  const currentPage = Math.max(1, isNaN(pagina) ? 1 : pagina);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (buscar) {
    where.OR = [
      { name: { contains: buscar, mode: "insensitive" } },
      { email: { contains: buscar, mode: "insensitive" } },
      { memberNumber: { contains: buscar, mode: "insensitive" } },
    ];
  }
  if (estado) {
    where.status = estado;
  }

  // Fetch members with pagination and counts in parallel
  const [members, totalCount, activeCount, pendingCount, expiredCount, cancelledCount] =
    await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          memberNumber: true,
          type: true,
          status: true,
          institution: true,
          cedula: true,
          specialty: true,
          stripeCustomerId: true,
          subscriptionId: true,
          subscriptionEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.member.count({ where }),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.count({ where: { status: "PENDING" } }),
      prisma.member.count({ where: { status: "EXPIRED" } }),
      prisma.member.count({ where: { status: "CANCELLED" } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build pagination URL helper
  function pageUrl(page: number) {
    const p = new URLSearchParams();
    if (buscar) p.set("buscar", buscar);
    if (estado) p.set("estado", estado);
    if (page > 1) p.set("pagina", String(page));
    const qs = p.toString();
    return `/admin/miembros${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Miembros</h1>
      </div>

      <div className="mb-6">
        <CreateMemberForm />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">
            {activeCount + pendingCount + expiredCount + cancelledCount}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-green-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Expirados</p>
          <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-4">
        <Suspense fallback={null}>
          <MemberSearch />
        </Suspense>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {members.map((member) => (
          <div key={member.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{member.name}</p>
                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
              </div>
              <Badge
                className={`shrink-0 ${statusColors[member.status] ?? "bg-gray-100 text-gray-800"}`}
              >
                {statusLabels[member.status] ?? member.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Desde: {format(member.createdAt, "d MMM yyyy", { locale: es })}</span>
              <span>
                Vence:{" "}
                {member.subscriptionEnd
                  ? format(member.subscriptionEnd, "d MMM yyyy", { locale: es })
                  : "---"}
              </span>
            </div>
            <div className="mt-3 border-t pt-3">
              <MemberActions
                member={{
                  id: member.id, name: member.name, email: member.email,
                  phone: member.phone, memberNumber: member.memberNumber,
                  type: member.type, status: member.status,
                  institution: member.institution, cedula: member.cedula,
                  specialty: member.specialty,
                  subscriptionEnd: member.subscriptionEnd ? member.subscriptionEnd.toISOString() : null,
                  createdAt: member.createdAt.toISOString(),
                }}
              />
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="rounded-xl border bg-white py-8 text-center text-muted-foreground">
            No hay miembros registrados
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-white sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Miembro desde</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.email}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      statusColors[member.status] ??
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {statusLabels[member.status] ?? member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(member.createdAt, "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.subscriptionEnd
                    ? format(member.subscriptionEnd, "d MMM yyyy", {
                        locale: es,
                      })
                    : "---"}
                </TableCell>
                <TableCell>
                  <MemberActions
                    member={{
                      id: member.id,
                      name: member.name,
                      email: member.email,
                      phone: member.phone,
                      memberNumber: member.memberNumber,
                      type: member.type,
                      status: member.status,
                      institution: member.institution,
                      cedula: member.cedula,
                      specialty: member.specialty,
                      subscriptionEnd: member.subscriptionEnd
                        ? member.subscriptionEnd.toISOString()
                        : null,
                      createdAt: member.createdAt.toISOString(),
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay miembros registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={pageUrl(currentPage - 1)}>
                <Button variant="outline" size="sm">
                  Anterior
                </Button>
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={pageUrl(currentPage + 1)}>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
