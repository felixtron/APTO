"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MembershipCtaProps {
  memberId: string;
  memberEmail: string;
  status: string; // PENDING, ACTIVE, EXPIRED, CANCELLED
  subscriptionEnd: string | null; // ISO date string
}

export function MembershipCta({
  memberId,
  memberEmail,
  status,
  subscriptionEnd,
}: MembershipCtaProps) {
  const [loading, setLoading] = useState(false);

  // Don't show if membership is active and not expiring soon
  const isActive = status === "ACTIVE";
  const isExpiringSoon =
    subscriptionEnd &&
    new Date(subscriptionEnd) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // within 30 days

  if (isActive && !isExpiringSoon) return null;

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, memberEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  }

  const buttonText =
    status === "PENDING"
      ? "Activar membresía"
      : "Renovar membresía";

  const message =
    status === "PENDING"
      ? "Activa tu membresía para acceder a todos los beneficios"
      : isExpiringSoon && isActive
        ? "Tu membresía está por vencer. Renueva ahora para no perder acceso."
        : "Tu membresía ha expirado. Renueva para recuperar el acceso a todos los beneficios.";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-amber-800">{message}</p>
        <Button onClick={handleCheckout} disabled={loading} size="sm">
          {loading ? "Procesando..." : buttonText}
        </Button>
      </div>
    </div>
  );
}
