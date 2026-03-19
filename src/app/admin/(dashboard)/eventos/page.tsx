"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageUpload } from "@/components/admin/image-upload";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  scheduledAt: string;
  endAt: string | null;
  modality: string;
  location: string | null;
  meetLink: string | null;
  price: number;
  priceStudent: number;
  priceProfessional: number;
  maxCapacity: number | null;
  active: boolean;
  membersOnly: boolean;
  createdAt: string;
  _count: { registrations: number };
}

const modalityLabels: Record<string, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
};

const emptyForm = {
  title: "",
  description: "",
  coverImage: null as string | null,
  scheduledAt: "",
  modality: "VIRTUAL",
  location: "",
  meetLink: "",
  priceStudent: "",
  priceTeacher: "",
  priceProfessional: "",
  maxCapacity: "",
  active: true,
  membersOnly: false,
};

export default function AdminEventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchEvents() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(event: Event) {
    setForm({
      title: event.title,
      description: event.description,
      coverImage: event.coverImage,
      scheduledAt: event.scheduledAt
        ? new Date(event.scheduledAt).toISOString().slice(0, 16)
        : "",
      modality: event.modality,
      location: event.location || "",
      meetLink: event.meetLink || "",
      priceStudent: event.priceStudent ? String(event.priceStudent / 100) : "",
      priceTeacher: event.price ? String(event.price / 100) : "",
      priceProfessional: event.priceProfessional ? String(event.priceProfessional / 100) : "",
      maxCapacity: event.maxCapacity ? String(event.maxCapacity) : "",
      active: event.active,
      membersOnly: event.membersOnly,
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId
      ? `/api/admin/events/${editingId}`
      : "/api/admin/events";

    const payload = {
      title: form.title,
      description: form.description,
      coverImage: form.coverImage,
      scheduledAt: form.scheduledAt,
      modality: form.modality,
      location: form.location || null,
      meetLink: form.meetLink || null,
      price: form.priceTeacher ? Math.round(parseFloat(form.priceTeacher) * 100) : 0,
      priceStudent: form.priceStudent ? Math.round(parseFloat(form.priceStudent) * 100) : 0,
      priceProfessional: form.priceProfessional ? Math.round(parseFloat(form.priceProfessional) * 100) : 0,
      maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
      active: form.active,
      membersOnly: form.membersOnly,
    };

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    closeForm();
    fetchEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este evento?")) return;

    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    fetchEvents();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar evento" : "Nuevo evento"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título del evento"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Imagen del evento (16:9)</Label>
              <div className="mt-1">
                <ImageUpload
                  value={form.coverImage}
                  onChange={(url) => setForm({ ...form, coverImage: url })}
                  folder="eventos"
                  aspectRatio="16/9"
                  placeholder="Arrastra la imagen del evento o haz clic para seleccionar"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descripción del evento"
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="scheduledAt">Fecha y hora</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm({ ...form, scheduledAt: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="modality">Modalidad</Label>
              <select
                id="modality"
                value={form.modality}
                onChange={(e) =>
                  setForm({ ...form, modality: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="VIRTUAL">Virtual</option>
                <option value="IN_PERSON">Presencial</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <Label htmlFor="location">Ubicación (opcional)</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Dirección o lugar"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="meetLink">Link de reunión (opcional)</Label>
              <Input
                id="meetLink"
                value={form.meetLink}
                onChange={(e) =>
                  setForm({ ...form, meetLink: e.target.value })
                }
                placeholder="https://meet.google.com/..."
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Precios por tipo de asistente (MXN)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="priceStudent">Estudiante</Label>
                  <Input
                    id="priceStudent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceStudent}
                    onChange={(e) => setForm({ ...form, priceStudent: e.target.value })}
                    placeholder="0 = Gratis"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priceTeacher">Maestro</Label>
                  <Input
                    id="priceTeacher"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceTeacher}
                    onChange={(e) => setForm({ ...form, priceTeacher: e.target.value })}
                    placeholder="0 = Gratis"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priceProfessional">Profesional</Label>
                  <Input
                    id="priceProfessional"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceProfessional}
                    onChange={(e) => setForm({ ...form, priceProfessional: e.target.value })}
                    placeholder="0 = Gratis"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="maxCapacity">Capacidad máxima (opcional)</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                value={form.maxCapacity}
                onChange={(e) =>
                  setForm({ ...form, maxCapacity: e.target.value })
                }
                placeholder="Sin límite"
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Activo</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.membersOnly}
                  onChange={(e) =>
                    setForm({ ...form, membersOnly: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Solo miembros</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Registros</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  {event.title}
                  {event.membersOnly && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">Solo miembros</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(event.scheduledAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {modalityLabels[event.modality] || event.modality}
                  </Badge>
                </TableCell>
                <TableCell>{event._count.registrations}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      event.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {event.active ? "Activo" : "Finalizado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(event)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay eventos. Crea el primero.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
