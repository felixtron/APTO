"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface RegistroBannerProps {
  registro: string | undefined;
}

export function RegistroBanner({ registro }: RegistroBannerProps) {
  if (registro === "exitoso") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          ¡Registro exitoso! Recibirás un correo de confirmación.
        </p>
      </div>
    );
  }

  if (registro === "cancelado") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <XCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          El proceso de pago fue cancelado. Puedes intentar registrarte de nuevo.
        </p>
      </div>
    );
  }

  return null;
}
