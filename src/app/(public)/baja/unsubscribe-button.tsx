"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "done" | "error";

export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function unsubscribe() {
    setState("loading");
    try {
      const res = await fetch(
        `/api/members/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No pudimos procesar tu solicitud");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Error de conexión");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-medium text-green-700">
        Listo. Ya no recibirás recordatorios de membresía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={unsubscribe} disabled={state === "loading"}>
        {state === "loading" ? "Procesando..." : "No quiero recibir recordatorios"}
      </Button>
      {state === "error" && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
