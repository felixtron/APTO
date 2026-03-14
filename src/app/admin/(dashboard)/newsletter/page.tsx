export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewsletterActions, NewsletterRowActions } from "./newsletter-actions";

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  SCHEDULED: "default",
  SENT: "default",
  FAILED: "destructive",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programado",
  SENT: "Enviado",
  FAILED: "Error",
};

export default async function AdminNewsletterPage() {
  const [newsletters, subscriberCount, sentThisYear] = await Promise.all([
    prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.newsletter.count({
      where: {
        status: "SENT",
        sentAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
  ]);

  const totalRecipients = newsletters
    .filter((n) => n.status === "SENT")
    .reduce((sum, n) => sum + n.recipientCount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <NewsletterActions />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suscriptores activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscriberCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enviados este año
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sentThisYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de envíos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRecipients}</p>
          </CardContent>
        </Card>
      </div>

      {newsletters.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          No hay boletines aún. Crea uno nuevo o genera uno con IA.
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.map((nl) => (
                <TableRow key={nl.id}>
                  <TableCell className="max-w-xs truncate font-medium">
                    {nl.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[nl.status]}>
                      {statusLabels[nl.status] || nl.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {nl.recipientCount || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(nl.sentAt || nl.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <NewsletterRowActions
                      id={nl.id}
                      status={nl.status}
                      subject={nl.subject}
                      content={nl.content}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
