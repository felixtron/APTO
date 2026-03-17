"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Prices {
  student: number;
  teacher: number;
  professional: number;
}

interface EventRegistrationProps {
  eventId: string;
  eventTitle: string;
  prices: Prices;
  spotsLeft: number | null;
  eventSlug: string;
}

const tierLabels: Record<string, string> = {
  student: "Estudiante",
  teacher: "Maestro",
  professional: "Profesional",
};

function formatPrice(centavos: number) {
  return centavos === 0
    ? "Gratis"
    : `$${(centavos / 100).toLocaleString()} MXN`;
}

export function EventRegistration({
  eventId,
  eventTitle,
  prices,
  spotsLeft,
}: EventRegistrationProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationType, setRegistrationType] = useState("professional");
  const [error, setError] = useState("");

  const isSoldOut = spotsLeft === 0;
  const allFree = prices.student === 0 && prices.teacher === 0 && prices.professional === 0;
  const selectedPrice = prices[registrationType as keyof Prices] ?? 0;
  const isFree = selectedPrice === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, email, phone, registrationType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar registro");
        setLoading(false);
        return;
      }

      if (data.free) {
        setOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        setRegistrationType("professional");
        toast.success("¡Registro exitoso!", {
          description: `Te has registrado en "${eventTitle}". Recibirás un correo de confirmación.`,
        });
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("Respuesta inesperada del servidor");
      setLoading(false);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" disabled={isSoldOut} />
        }
      >
        {isSoldOut ? "Cupo lleno" : "Registrarme"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro para evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {eventTitle}
          </p>

          {/* Tier selector */}
          {!allFree && (
            <div className="grid gap-2">
              <Label>Tipo de asistente</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["student", "teacher", "professional"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setRegistrationType(tier)}
                    className={`rounded-lg border p-3 text-center transition-colors ${
                      registrationType === tier
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    <p className="text-xs font-medium">{tierLabels[tier]}</p>
                    <p className="mt-1 text-sm font-bold">
                      {formatPrice(prices[tier])}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reg-name">Nombre completo *</Label>
            <Input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-email">Correo electrónico *</Label>
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-phone">Teléfono (opcional)</Label>
            <Input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10 dígitos"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-medium">
              {isFree
                ? "Gratuito"
                : `${formatPrice(selectedPrice)}`}
            </p>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Procesando..."
                : isFree
                  ? "Confirmar registro"
                  : "Continuar al pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
