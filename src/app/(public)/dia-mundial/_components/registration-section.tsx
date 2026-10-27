"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIA_MUNDIAL, OPEN_ACCESS_COPY, type EventWindowStatus } from "@/lib/dia-mundial";

const GALLERY_ID = "grabaciones";
const GALLERY_SCROLL_TIMEOUT_MS = 10_000;

/** router.refresh() is not awaitable. Keep looking until the gallery replaces this section. */
function scrollToGalleryWhenReady() {
  const started = performance.now();
  const tick = () => {
    const gallery = document.getElementById(GALLERY_ID);
    if (gallery) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gallery.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      return;
    }
    if (performance.now() - started < GALLERY_SCROLL_TIMEOUT_MS) {
      window.requestAnimationFrame(tick);
    }
  };
  window.requestAnimationFrame(tick);
}

interface RegistrationSectionProps {
  status: Exclude<EventWindowStatus, "closed">;
  registered: boolean;
}

export function RegistrationSection({ status, registered }: RegistrationSectionProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptsEmails, setAcceptsEmails] = useState(true);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRegistered, setJustRegistered] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dia-mundial/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, acceptsEmails, website }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          res.status === 429
            ? "Demasiados intentos. Espera un momento e inténtalo de nuevo."
            : data.error || "No pudimos completar tu registro.";
        setError(message);
        toast.error(message);
        return;
      }

      setJustRegistered(data.name || name);
      toast.success("¡Registro exitoso!", {
        description:
          status === "open"
            ? "Ya puedes ver las grabaciones."
            : "Te esperamos el 27 de octubre.",
      });
      if (status === "open") scrollToGalleryWhenReady();
      router.refresh();
    } catch {
      const message = "Error de conexión. Inténtalo de nuevo.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const done = registered || justRegistered !== null;

  return (
    <section id="registro" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-white p-6 shadow-xl sm:p-10">
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
                {justRegistered ? `¡Listo, ${justRegistered.split(" ")[0]}!` : "Ya estás registrado"}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                {status === "open"
                  ? "Las grabaciones están disponibles en esta página."
                  : `Las grabaciones se abren el 27 de octubre. Te enviamos un correo con el enlace; vuelve ${DIA_MUNDIAL.dateLabel.toLowerCase()}.`}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                  {status === "open" ? (
                    <Unlock className="h-7 w-7 text-brand-600" aria-hidden="true" />
                  ) : (
                    <Lock className="h-7 w-7 text-brand-600" aria-hidden="true" />
                  )}
                </div>
                <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
                  {status === "open" ? OPEN_ACCESS_COPY.registrationTitle : "Registro gratuito"}
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  {status === "open"
                    ? OPEN_ACCESS_COPY.registrationBody
                    : `Sin costo y sin membresía. Solo necesitamos tu nombre y correo para darte acceso a las grabaciones ${DIA_MUNDIAL.dateLabel.toLowerCase()}.`}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="reg-name">Nombre completo</Label>
                  <Input
                    id="reg-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Correo electrónico</Label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="mt-1 h-11"
                  />
                </div>

                {/* Honeypot: invisible para personas */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="reg-website">No llenar este campo</label>
                  <input
                    id="reg-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={acceptsEmails}
                    onChange={(e) => setAcceptsEmails(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  Acepto recibir información de APTO y COTEOC sobre eventos y actividades.
                </label>

                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="h-12 w-full bg-green-600 text-base font-bold text-white hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : status === "open" ? (
                    OPEN_ACCESS_COPY.registrationSubmit
                  ) : (
                    "Registrarme gratis"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Usaremos tus datos solo para el evento y, si lo aceptas, para informarte de
                  actividades de APTO y COTEOC.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
