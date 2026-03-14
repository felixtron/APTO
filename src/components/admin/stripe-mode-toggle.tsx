"use client";

import { useEffect, useState } from "react";
import type { StripeMode } from "@/lib/stripe";

export function StripeModeToggle() {
  const [mode, setMode] = useState<StripeMode | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stripe-mode")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("test"));
  }, []);

  async function toggle() {
    if (!mode) return;
    const newMode: StripeMode = mode === "test" ? "live" : "test";

    if (
      newMode === "live" &&
      !confirm(
        "¿Cambiar a modo PRODUCCIÓN?\n\nLos cobros serán REALES."
      )
    ) {
      return;
    }

    setSwitching(true);
    try {
      const res = await fetch("/api/admin/stripe-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await res.json();
      setMode(data.mode);
    } catch {
      // ignore
    } finally {
      setSwitching(false);
    }
  }

  if (!mode) return null;

  const isLive = mode === "live";

  return (
    <button
      onClick={toggle}
      disabled={switching}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        isLive
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
      title={`Stripe en modo ${isLive ? "producción" : "pruebas"}. Click para cambiar.`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          isLive ? "bg-red-500" : "bg-amber-500"
        }`}
      />
      {switching
        ? "..."
        : isLive
          ? "Stripe LIVE"
          : "Stripe TEST"}
    </button>
  );
}
