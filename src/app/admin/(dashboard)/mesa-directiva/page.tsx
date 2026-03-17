"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { Plus, Users, GripVertical, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";

interface BoardMember {
  id: string;
  name: string;
  title: string;
  role: string | null;
  bio: string;
  photoUrl: string | null;
  displayOrder: number;
}

const emptyForm = { name: "", title: "", role: "", bio: "", photoUrl: null as string | null };

export default function AdminMesaDirectivaPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchMembers() {
    const res = await fetch("/api/admin/board-members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(member: BoardMember) {
    setForm({
      name: member.name,
      title: member.title,
      role: member.role || "",
      bio: member.bio,
      photoUrl: member.photoUrl,
    });
    setEditingId(member.id);
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
      ? `/api/admin/board-members/${editingId}`
      : "/api/admin/board-members";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchMembers();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este miembro de la mesa directiva?")) return;

    await fetch(`/api/admin/board-members/${id}`, { method: "DELETE" });
    fetchMembers();
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
        <h1 className="text-2xl font-bold">Mesa Directiva</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar miembro
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar miembro" : "Nuevo miembro"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Foto</Label>
              <div className="mt-1 max-w-xs">
                <ImageUpload
                  value={form.photoUrl}
                  onChange={(url) => setForm({ ...form, photoUrl: url })}
                  folder="mesa-directiva"
                  aspectRatio="1/1"
                  placeholder="Foto del miembro (cuadrada)"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="T.O. Nombre Completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="title">Cargo</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Presidenta, Secretaria, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol adicional (opcional)</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Delegada ante WFOT"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio breve (opcional)</Label>
              <Input
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Breve descripción"
                className="mt-1"
              />
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

      {/* List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 rounded-xl border bg-white p-4"
          >
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={member.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Users className="h-5 w-5 text-brand-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-brand-500">{member.title}</p>
              {member.role && (
                <p className="text-xs text-muted-foreground">{member.role}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleDelete(member.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
            No hay miembros en la mesa directiva. Agrega el primero.
          </div>
        )}
      </div>
    </div>
  );
}
