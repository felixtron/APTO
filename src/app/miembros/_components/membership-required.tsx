"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembershipRequiredProps {
  sectionTitle: string;
  sectionDescription?: string;
  memberId: string;
  memberEmail: string;
  memberType: string; // STUDENT | PROFESSIONAL
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
}

const statusCopy: Record<string, { title: string; body: string }> = {
  PENDING: {
    title: "Activa tu membresía para acceder",
    body: "Tu cuenta está registrada pero aún no has realizado el pago anual. Completa tu suscripción para desbloquear todas las secciones exclusivas.",
  },
  EXPIRED: {
    title: "Tu membresía ha expirado",
    body: "Renueva tu suscripción anual para volver a acceder a las secciones exclusivas de APTO.",
  },
  CANCELLED: {
    title: "Membresía cancelada",
    body: "Vuelve a activarla para recuperar el acceso a esta sección.",
  },
};

const DEFAULT_COPY = statusCopy.PENDING;

export function MembershipRequired({
  sectionTitle,
  sectionDescription,
  memberId,
  memberEmail,
  memberType,
  status,
}: MembershipRequiredProps) {
  const [loading, setLoading] = useState(false);
  const copy = statusCopy[status ?? ""] ?? DEFAULT_COPY;

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: memberType === "STUDENT" ? "student" : "professional",
          memberId,
          memberEmail,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  }

  const price = memberType === "STUDENT" ? "$300 MXN" : "$800 MXN";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold sm:text-2xl">{sectionTitle}</h1>
        {sectionDescription && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {sectionDescription}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/60 to-white p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
          {copy.title}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
          {copy.body}
        </p>

        <div className="mx-auto mb-6 max-w-sm rounded-xl border bg-white p-4 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Beneficios incluidos
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Descarga de constancias y certificados
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Biblioteca completa de grabaciones
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Directorio profesional
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Bolsa de trabajo exclusiva
            </li>
          </ul>
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirigiendo a pago seguro...
            </>
          ) : (
            <>Pagar membresía anual · {price}</>
          )}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Pago seguro vía Stripe ·{" "}
          <Link href="/miembros" className="underline hover:text-brand-700">
            Volver al dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
