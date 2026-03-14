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
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  fileUrl: string | null;
  externalUrl: string | null;
  thumbnailUrl: string | null;
  membersOnly: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-100 text-red-800",
  VIDEO: "bg-purple-100 text-purple-800",
  LINK: "bg-blue-100 text-blue-800",
  DOCUMENT: "bg-amber-100 text-amber-800",
};

const emptyForm = {
  title: "",
  description: "",
  type: "PDF",
  fileUrl: "",
  externalUrl: "",
  membersOnly: false,
  active: true,
};

export default function AdminRecursosPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchResources() {
    const res = await fetch("/api/admin/resources");
    const data = await res.json();
    setResources(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchResources();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(resource: Resource) {
    setForm({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      fileUrl: resource.fileUrl || "",
      externalUrl: resource.externalUrl || "",
      membersOnly: resource.membersOnly,
      active: resource.active,
    });
    setEditingId(resource.id);
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
      ? `/api/admin/resources/${editingId}`
      : "/api/admin/resources";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchResources();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este recurso?")) return;

    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    fetchResources();
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
        <h1 className="text-2xl font-bold">Recursos</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo recurso
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar recurso" : "Nuevo recurso"}
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
                placeholder="Guía de Práctica Clínica"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="PDF">PDF</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">Enlace</option>
                <option value="DOCUMENT">Documento</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descripción del recurso..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fileUrl">URL del archivo (opcional)</Label>
              <Input
                id="fileUrl"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://ejemplo.com/archivo.pdf"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="externalUrl">URL externa (opcional)</Label>
              <Input
                id="externalUrl"
                value={form.externalUrl}
                onChange={(e) =>
                  setForm({ ...form, externalUrl: e.target.value })
                }
                placeholder="https://ejemplo.com"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Activo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.membersOnly}
                  onChange={(e) =>
                    setForm({ ...form, membersOnly: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Solo miembros
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
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium">{resource.title}</TableCell>
                <TableCell>
                  <Badge className={TYPE_COLORS[resource.type] || ""}>
                    {resource.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {resource.membersOnly ? (
                    <Badge variant="secondary">Solo miembros</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Público
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {resource.active ? (
                    <Badge className="bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      Inactivo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(resource)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(resource.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {resources.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay recursos. Agrega el primero.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
