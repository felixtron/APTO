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
import { Plus, Pencil, Trash2, X, GraduationCap } from "lucide-react";

interface University {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  degrees: string[];
  location: string;
  website: string | null;
  logoUrl: string | null;
  active: boolean;
  displayOrder: number;
}

const emptyForm = {
  name: "",
  shortName: "",
  description: "",
  degrees: "",
  location: "",
  website: "",
  active: true,
};

export default function AdminUniversidadesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchUniversities() {
    const res = await fetch("/api/admin/universities");
    const data = await res.json();
    setUniversities(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUniversities();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(university: University) {
    setForm({
      name: university.name,
      shortName: university.shortName || "",
      description: university.description || "",
      degrees: university.degrees.join(", "),
      location: university.location,
      website: university.website || "",
      active: university.active,
    });
    setEditingId(university.id);
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
      ? `/api/admin/universities/${editingId}`
      : "/api/admin/universities";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchUniversities();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta universidad?")) return;

    await fetch(`/api/admin/universities/${id}`, { method: "DELETE" });
    fetchUniversities();
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
        <h1 className="text-2xl font-bold">Universidades</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar universidad
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar universidad" : "Nueva universidad"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Universidad Nacional Autónoma de México"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shortName">Siglas</Label>
              <Input
                id="shortName"
                value={form.shortName}
                onChange={(e) =>
                  setForm({ ...form, shortName: e.target.value })
                }
                placeholder="UNAM"
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
                placeholder="Breve descripción del programa de Terapia Ocupacional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="degrees">Programas (separados por coma)</Label>
              <Input
                id="degrees"
                value={form.degrees}
                onChange={(e) => setForm({ ...form, degrees: e.target.value })}
                placeholder="Licenciatura, Maestría"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                required
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Ciudad de México"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="website">Sitio web (opcional)</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://www.universidad.edu.mx"
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
              <TableHead>#</TableHead>
              <TableHead>Siglas</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Programas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {universities.map((university) => (
              <TableRow key={university.id}>
                <TableCell className="text-muted-foreground">
                  {university.displayOrder}
                </TableCell>
                <TableCell className="font-medium">
                  {university.shortName || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                      <GraduationCap className="h-4 w-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="font-medium">{university.name}</p>
                      {!university.active && (
                        <Badge variant="secondary" className="mt-0.5 text-xs">
                          Inactiva
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {university.location}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {university.degrees.map((degree) => (
                      <Badge
                        key={degree}
                        variant="secondary"
                        className="bg-green-50 text-green-700"
                      >
                        {degree}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(university)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(university.id)}
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
        {universities.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay universidades registradas. Agrega la primera.
          </div>
        )}
      </div>
    </div>
  );
}
