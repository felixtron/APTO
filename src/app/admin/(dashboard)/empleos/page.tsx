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

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string | null;
  salary: string | null;
  contactEmail: string;
  contactPhone: string | null;
  active: boolean;
  membersOnly: boolean;
  expiresAt: string;
  createdAt: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance",
};

const emptyForm = {
  title: "",
  company: "",
  location: "",
  type: "FULL_TIME",
  description: "",
  requirements: "",
  salary: "",
  contactEmail: "",
  contactPhone: "",
  expiresAt: "",
  active: true,
  membersOnly: false,
};

export default function AdminEmpleosPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchJobs() {
    const res = await fetch("/api/admin/jobs");
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(job: JobPosting) {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements || "",
      salary: job.salary || "",
      contactEmail: job.contactEmail,
      contactPhone: job.contactPhone || "",
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : "",
      active: job.active,
      membersOnly: job.membersOnly,
    });
    setEditingId(job.id);
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
      ? `/api/admin/jobs/${editingId}`
      : "/api/admin/jobs";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchJobs();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta oferta de empleo?")) return;

    await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    fetchJobs();
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
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
        <h1 className="text-xl font-bold sm:text-2xl">Bolsa de Trabajo</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva oferta
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar empleo" : "Nuevo empleo"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Puesto</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Terapeuta Ocupacional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Hospital ABC"
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
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="FULL_TIME">Tiempo completo</option>
                <option value="PART_TIME">Medio tiempo</option>
                <option value="CONTRACT">Contrato</option>
                <option value="FREELANCE">Freelance</option>
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
                placeholder="Descripción del puesto..."
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="requirements">Requisitos (opcional)</Label>
              <Textarea
                id="requirements"
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
                placeholder="Requisitos del puesto..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="salary">Salario (opcional)</Label>
              <Input
                id="salary"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="$15,000 - $20,000 MXN"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email de contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder="rh@empresa.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">
                Teléfono de contacto (opcional)
              </Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
                placeholder="55 1234 5678"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Fecha de vencimiento</Label>
              <Input
                id="expiresAt"
                type="date"
                required
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:col-span-2">
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

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              {job.active && !isExpired(job.expiresAt) ? (
                <Badge className="shrink-0 bg-green-100 text-green-800">Activo</Badge>
              ) : (
                <Badge className="shrink-0 bg-gray-100 text-gray-800">Expirado</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{job.location}</span>
              <Badge variant="secondary" className="text-[10px]">
                {JOB_TYPE_LABELS[job.type] || job.type}
              </Badge>
              <span>Vence: {new Date(job.expiresAt).toLocaleDateString("es-MX")}</span>
            </div>
            <div className="mt-3 flex gap-1 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(job.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="rounded-xl border bg-white py-8 text-center text-muted-foreground">
            No hay empleos publicados. Agrega el primero.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-white sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puesto</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {job.company}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.location}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {JOB_TYPE_LABELS[job.type] || job.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(job.expiresAt).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell>
                  {job.active && !isExpired(job.expiresAt) ? (
                    <Badge className="bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      Expirado
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(job)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay empleos publicados. Agrega el primero.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
