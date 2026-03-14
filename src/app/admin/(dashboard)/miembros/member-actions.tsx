"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MemberSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  memberNumber: string | null;
  type: string;
  status: string;
  institution: string | null;
  cedula: string | null;
  specialty: string | null;
  subscriptionEnd: string | null;
  createdAt: string;
}

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

const typeLabels: Record<string, string> = {
  PROFESSIONAL: "Profesional",
};

export function MemberActions({ member }: { member: MemberSummary }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Error al actualizar");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating member status:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" />}
      >
        Ver
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle del Miembro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre</p>
              <p className="font-medium">{member.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefono</p>
              <p className="font-medium">{member.phone || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">No. Miembro</p>
              <p className="font-medium">{member.memberNumber || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge
                className={
                  statusColors[member.status] ?? "bg-gray-100 text-gray-800"
                }
              >
                {statusLabels[member.status] ?? member.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium">
                {typeLabels[member.type] ?? member.type}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Institucion</p>
              <p className="font-medium">{member.institution || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cedula</p>
              <p className="font-medium">{member.cedula || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Especialidad</p>
              <p className="font-medium">{member.specialty || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vence</p>
              <p className="font-medium">
                {member.subscriptionEnd
                  ? format(new Date(member.subscriptionEnd), "d MMM yyyy", {
                      locale: es,
                    })
                  : "---"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Fecha de registro</p>
              <p className="font-medium">
                {format(new Date(member.createdAt), "d MMM yyyy", {
                  locale: es,
                })}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            {member.status !== "ACTIVE" && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => updateStatus("ACTIVE")}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {loading ? "Procesando..." : "Activar"}
              </Button>
            )}
            {member.status === "ACTIVE" && (
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={() => updateStatus("EXPIRED")}
              >
                {loading ? "Procesando..." : "Suspender"}
              </Button>
            )}
            {member.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => updateStatus("CANCELLED")}
              >
                {loading ? "Procesando..." : "Cancelar"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
