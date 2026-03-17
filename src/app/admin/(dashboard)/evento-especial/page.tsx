"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/admin/image-upload";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface SpecialEvent {
  id: string;
  slug: string;
  navLabel: string;
  title: string;
  description: string | null;
  programImage: string | null;
  registrationUrl: string | null;
  active: boolean;
  year: number;
}

const emptyForm = {
  slug: "",
  navLabel: "",
  title: "",
  description: "",
  programImage: "",
  registrationUrl: "",
  active: false,
  year: new Date().getFullYear().toString(),
};

export default function EventoEspecialPage() {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function fetchEvents() {
    const res = await fetch("/api/admin/special-event");
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(event: SpecialEvent) {
    setEditingId(event.id);
    setForm({
      slug: event.slug,
      navLabel: event.navLabel,
      title: event.title,
      description: event.description || "",
      programImage: event.programImage || "",
      registrationUrl: event.registrationUrl || "",
      active: event.active,
      year: event.year.toString(),
    });
    setShowForm(true);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId
      ? `/api/admin/special-event/${editingId}`
      : "/api/admin/special-event";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este evento especial?")) return;
    await fetch(`/api/admin/special-event/${id}`, { method: "DELETE" });
    fetchEvents();
  }

  async function toggleActive(event: SpecialEvent) {
    await fetch(`/api/admin/special-event/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, active: !event.active }),
    });
    fetchEvents();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evento Especial</h1>
          <p className="text-sm text-muted-foreground">
            Configura la página del Día Mundial de TO u otro evento especial.
            Solo un evento puede estar activo a la vez.
          </p>
        </div>
        {!showForm && (
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border bg-white p-6"
        >
          <h2 className="text-lg font-semibold">
            {editingId ? "Editar Evento Especial" : "Nuevo Evento Especial"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Texto del botón en menú *
              </label>
              <input
                required
                value={form.navLabel}
                onChange={(e) => {
                  setForm({
                    ...form,
                    navLabel: e.target.value,
                    slug: form.slug || generateSlug(e.target.value),
                  });
                }}
                placeholder="Día Mundial TO 2025"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece como botón verde en la navegación
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Año *</label>
              <input
                required
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Título de la página *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Día Mundial de la Terapia Ocupacional 2025"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/evento/</span>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="dia-mundial-to-2025"
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Descripción del evento..."
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Imagen del programa
            </label>
            <ImageUpload
              value={form.programImage || null}
              onChange={(url) =>
                setForm({ ...form, programImage: url || "" })
              }
              folder="eventos"
              placeholder="Sube la imagen del programa"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              URL de registro (Eventbrite, Google Forms, etc.)
            </label>
            <input
              value={form.registrationUrl}
              onChange={(e) =>
                setForm({ ...form, registrationUrl: e.target.value })
              }
              placeholder="https://www.eventbrite.com/..."
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Activo (visible en el menú principal)
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {events.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No hay eventos especiales configurados.
          </p>
          <Button onClick={openNew} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Crear primer evento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                event.active ? "border-green-200 bg-green-50/50" : "bg-white"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  {event.active && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Menú: &quot;{event.navLabel}&quot; &middot; /evento/{event.slug}{" "}
                  &middot; {event.year}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive(event)}
                  title={event.active ? "Desactivar" : "Activar"}
                >
                  {event.active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(event)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
