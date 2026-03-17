"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  institution: "",
  cedula: "",
  specialty: "",
  paymentMethod: "efectivo",
  subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
};

export function CreateMemberForm() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear miembro");
        setSaving(false);
        return;
      }

      // Auto-send password reset email
      await fetch(`/api/admin/members/${data.id}/reset-password`, {
        method: "POST",
      });

      setSuccess(
        `Miembro creado: ${data.name} (${data.memberNumber}). Se envió email a ${data.email} para crear su contraseña.`
      );
      setForm(emptyForm);
      setSaving(false);

      // Refresh page after short delay
      setTimeout(() => {
        setShowForm(false);
        setSuccess("");
        router.refresh();
      }, 3000);
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Miembro
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-white p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold">
          Registrar Miembro (Pago en efectivo/transferencia)
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre completo"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="correo@ejemplo.com"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="55 1234 5678"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Institución</label>
          <input
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            placeholder="Hospital, clínica, universidad..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cédula</label>
          <input
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            placeholder="Número de cédula"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Especialidad</label>
          <input
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            placeholder="Área de especialización"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Método de pago
          </label>
          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.target.value })
            }
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia bancaria</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Membresía válida hasta
          </label>
          <input
            required
            type="date"
            value={form.subscriptionEnd}
            onChange={(e) =>
              setForm({ ...form, subscriptionEnd: e.target.value })
            }
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Creando..." : "Crear y enviar acceso"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowForm(false);
            setError("");
            setSuccess("");
          }}
        >
          Cancelar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Se creará el miembro como Activo y se le enviará un email para que
        establezca su contraseña de acceso al portal.
      </p>
    </form>
  );
}
