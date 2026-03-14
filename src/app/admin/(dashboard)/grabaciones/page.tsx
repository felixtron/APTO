"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Video } from "lucide-react";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  eventTitle: string | null;
  category: string | null;
  active: boolean;
  displayOrder: number;
}

const emptyForm = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: "",
  eventTitle: "",
  category: "",
  active: true,
};

export default function AdminGrabacionesPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchRecordings() {
    const res = await fetch("/api/admin/recordings");
    const data = await res.json();
    setRecordings(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRecordings();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(recording: Recording) {
    setForm({
      title: recording.title,
      description: recording.description || "",
      videoUrl: recording.videoUrl,
      thumbnailUrl: recording.thumbnailUrl || "",
      duration: recording.duration?.toString() || "",
      eventTitle: recording.eventTitle || "",
      category: recording.category || "",
      active: recording.active,
    });
    setEditingId(recording.id);
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
      ? `/api/admin/recordings/${editingId}`
      : "/api/admin/recordings";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchRecordings();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta grabación?")) return;

    await fetch(`/api/admin/recordings/${id}`, { method: "DELETE" });
    fetchRecordings();
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
        <h1 className="text-2xl font-bold">Grabaciones</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva grabación
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar grabación" : "Nueva grabación"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Congreso Virtual 2024 - Conferencia Magistral"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="videoUrl">URL del video</Label>
              <Input
                id="videoUrl"
                required
                value={form.videoUrl}
                onChange={(e) =>
                  setForm({ ...form, videoUrl: e.target.value })
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Breve descripción del contenido de la grabación"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="thumbnailUrl">URL de miniatura (opcional)</Label>
              <Input
                id="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm({ ...form, thumbnailUrl: e.target.value })
                }
                placeholder="https://img.youtube.com/vi/.../0.jpg"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
                placeholder="90"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventTitle">Evento relacionado (opcional)</Label>
              <Input
                id="eventTitle"
                value={form.eventTitle}
                onChange={(e) =>
                  setForm({ ...form, eventTitle: e.target.value })
                }
                placeholder="Congreso Nacional 2024"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="Congresos, Seminarios, Conferencias, Talleres"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active">Activa</Label>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar"
                    : "Crear"}
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
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings.map((recording) => (
              <TableRow key={recording.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                      <Video className="h-4 w-4 text-brand-400" />
                    </div>
                    <p className="font-medium">{recording.title}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {recording.category && (
                    <Badge variant="secondary">{recording.category}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {recording.duration ? `${recording.duration} min` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      recording.active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {recording.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(recording)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(recording.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {recordings.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay grabaciones registradas. Agrega la primera.
          </div>
        )}
      </div>
    </div>
  );
}
