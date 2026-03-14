"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MemberProfile = {
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  cedula: string | null;
  specialty: string | null;
  memberNumber: string | null;
};

export function ProfileForm({ member }: { member: MemberProfile }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setProfileError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/members/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          institution: formData.get("institution"),
          cedula: formData.get("cedula"),
          specialty: formData.get("specialty"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Error al guardar cambios"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSaved(false);
    setPasswordError("");

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmNewPassword = formData.get("confirmNewPassword") as string;

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas no coinciden");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/members/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar contraseña");
      }

      setPasswordSaved(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Error al actualizar contraseña"
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          {member.memberNumber && (
            <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Número de miembro</p>
              <p className="text-sm font-medium">{member.memberNumber}</p>
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                defaultValue={member.name}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={member.email}
                className="mt-1"
                disabled
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El email no se puede cambiar
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={member.phone ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institución</Label>
              <Input
                id="institution"
                name="institution"
                defaultValue={member.institution ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cedula">Cédula profesional</Label>
              <Input
                id="cedula"
                name="cedula"
                defaultValue={member.cedula ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                name="specialty"
                defaultValue={member.specialty ?? ""}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">
                  Cambios guardados
                </span>
              )}
              {profileError && (
                <span className="text-sm text-red-600">{profileError}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                className="mt-1"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="outline" disabled={passwordLoading}>
                {passwordLoading
                  ? "Actualizando..."
                  : "Actualizar contraseña"}
              </Button>
              {passwordSaved && (
                <span className="text-sm text-green-600">
                  Contraseña actualizada
                </span>
              )}
              {passwordError && (
                <span className="text-sm text-red-600">{passwordError}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
