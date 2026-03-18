"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

interface SessionData {
  email: string;
  plan: string;
  customerId: string | null;
  subscriptionId: string | null;
}

function RegistroForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    setLoadingSession(true);
    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Sesión inválida");
        return res.json();
      })
      .then((data) => setSessionData(data))
      .catch(() => setError("No se pudo verificar el pago. Intenta de nuevo."))
      .finally(() => setLoadingSession(false));
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: sessionData?.email || formData.get("email"),
          phone: formData.get("phone"),
          password,
          institution: formData.get("institution"),
          ...(sessionId ? { sessionId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al registrar");
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const planLabel =
    sessionData?.plan === "student" ? "Estudiante" : "Profesional";

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verificando pago...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 inline-block">
            <Image
              src="/logo/logoAPTO.png"
              alt="APTO"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
          {sessionData ? (
            <>
              <div className="mx-auto mb-2 flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Pago confirmado — {planLabel}
              </div>
              <CardTitle>Completa tu Registro</CardTitle>
              <p className="text-sm text-muted-foreground">
                Crea tu cuenta para activar tu membresía
              </p>
            </>
          ) : (
            <>
              <CardTitle>Crear Cuenta</CardTitle>
              <p className="text-sm text-muted-foreground">
                Únete a la comunidad APTO
              </p>
            </>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Tu nombre completo"
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
                defaultValue={sessionData?.email || ""}
                readOnly={!!sessionData?.email}
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="55 1234 5678"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="institution">
                Institución / Universidad (opcional)
              </Label>
              <Input
                id="institution"
                name="institution"
                placeholder="Tu institución"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repite tu contraseña"
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Registrando..."
                : sessionData
                  ? "Activar membresía"
                  : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-brand-500 hover:text-brand-600"
            >
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RegistroForm />
    </Suspense>
  );
}
