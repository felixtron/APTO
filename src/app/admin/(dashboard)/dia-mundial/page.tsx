export const dynamic = "force-dynamic";

import Link from "next/link";
import { Download, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";
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

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ buscar?: string; pagina?: string }>;
}

function pageUrl(page: number, buscar: string): string {
  const params = new URLSearchParams();
  if (buscar) params.set("buscar", buscar);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return `/admin/dia-mundial${query ? `?${query}` : ""}`;
}

export default async function AdminDiaMundialPage({ searchParams }: PageProps) {
  const { buscar = "", pagina } = await searchParams;
  const search = buscar.trim();
  const page = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);

  const where = {
    campaign: DIA_MUNDIAL.campaign,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, filtered, total, acceptsEmails] = await Promise.all([
    prisma.campaignRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.campaignRegistration.count({ where }),
    prisma.campaignRegistration.count({ where: { campaign: DIA_MUNDIAL.campaign } }),
    prisma.campaignRegistration.count({
      where: { campaign: DIA_MUNDIAL.campaign, acceptsEmails: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Registros Día Mundial</h1>
          <p className="text-sm text-muted-foreground">
            {total} registros · {acceptsEmails} aceptan recibir correos
          </p>
        </div>
        <Button render={<a href="/api/admin/campaign-registrations/export" />}>
          <Download className="mr-1.5 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <form action="/admin/dia-mundial" className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="buscar"
          defaultValue={search}
          placeholder="Buscar por nombre o correo"
          className="h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </form>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Correos</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.email}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      row.acceptsEmails
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {row.acceptsEmails ? "Acepta" : "No acepta"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.createdAt.toLocaleString("es-MX", {
                    timeZone: "America/Mexico_City",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {search ? "Sin resultados para esa búsqueda." : "Aún no hay registros."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" render={<Link href={pageUrl(page - 1, search)} />}>
                Anterior
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" render={<Link href={pageUrl(page + 1, search)} />}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
