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

interface EventRegistrationProps {
  eventId: string;
  eventTitle: string;
  price: number; // centavos
  spotsLeft: number | null; // null = unlimited
  eventSlug: string;
}

export function EventRegistration({
  eventId,
  eventTitle,
  price,
  spotsLeft,
}: EventRegistrationProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const isSoldOut = spotsLeft === 0;
  const isFree = price === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, email, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar registro");
        setLoading(false);
        return;
      }

      if (data.free) {
        // Free event — registration confirmed
        setOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        toast.success("¡Registro exitoso!", {
          description: `Te has registrado en "${eventTitle}". Recibirás un correo de confirmación.`,
        });
        setLoading(false);
        return;
      }

      if (data.url) {
        // Paid event — redirect to Stripe checkout
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
                : `$${(price / 100).toLocaleString()} MXN`}
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
