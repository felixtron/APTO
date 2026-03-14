"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_ADDRESS,
  CONTACT_HOURS,
} from "@/lib/constants";

export default function ContactoPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      if (res.ok) {
        setSent(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Contacto
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos para ayudarte. Envíanos un mensaje o visítanos.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Formulario */}
            <div>
              {sent ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                  <h2 className="text-xl font-semibold text-green-800">
                    Mensaje enviado
                  </h2>
                  <p className="mt-2 text-sm text-green-700">
                    Gracias por contactarnos. Te responderemos a la brevedad.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Tu nombre"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="tu@email.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Asunto del mensaje"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Escribe tu mensaje..."
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </form>
              )}
            </div>

            {/* Info de contacto */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Mail className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Phone className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Teléfono</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CONTACT_PHONE}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <MapPin className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Dirección</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CONTACT_ADDRESS}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Clock className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Horario</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CONTACT_HOURS}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
