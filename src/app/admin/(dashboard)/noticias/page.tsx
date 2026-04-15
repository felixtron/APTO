"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X, ImagePlus, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  published: boolean;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  NOTICIAS: "Noticias",
  EVENTOS: "Eventos",
  CLASIFICADOS: "Clasificados",
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "NOTICIAS",
  published: false,
  featured: false,
};

export default function AdminNoticiasPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function fetchPosts() {
    const res = await fetch("/api/admin/posts");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(post: Post) {
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || "",
      category: post.category,
      published: post.published,
      featured: post.featured,
    });
    setEditingId(post.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "noticias");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, coverImage: data.url }));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId
      ? `/api/admin/posts/${editingId}`
      : "/api/admin/posts";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    closeForm();
    fetchPosts();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta noticia?")) return;

    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    fetchPosts();
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
        <h1 className="text-xl font-bold sm:text-2xl">Noticias</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva noticia
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? "Editar noticia" : "Nueva noticia"}
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
                placeholder="Título de la noticia"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="excerpt">Extracto</Label>
              <Input
                id="excerpt"
                required
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Breve descripción de la noticia"
                className="mt-1"
              />
            </div>
            {/* Cover image */}
            <div className="sm:col-span-2">
              <Label>Imagen de portada</Label>
              <div className="mt-1 flex items-start gap-4">
                {/* Preview */}
                <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                  {form.coverImage ? (
                    <img
                      src={form.coverImage}
                      alt="Portada"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                      {uploadingImage ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo...</>
                      ) : (
                        <><ImagePlus className="h-3.5 w-3.5" /> {form.coverImage ? "Cambiar imagen" : "Subir imagen"}</>
                      )}
                    </span>
                  </label>
                  {form.coverImage && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                      className="text-xs text-red-500 hover:text-red-700 text-left"
                    >
                      Quitar imagen
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 10 MB</p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="content">Contenido</Label>
              <textarea
                id="content"
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Contenido completo de la noticia"
                rows={6}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="NOTICIAS">Noticias</option>
                <option value="EVENTOS">Eventos</option>
                <option value="CLASIFICADOS">Clasificados</option>
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-4 sm:gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Publicado</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Destacado</span>
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
        {posts.map((post) => (
          <div key={post.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{post.title}</p>
              <Badge
                className={`shrink-0 ${post.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
              >
                {post.published ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">
                {categoryLabels[post.category] || post.category}
              </Badge>
              <span>
                {new Date(post.createdAt).toLocaleDateString("es-MX", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>
            <div className="mt-3 flex gap-1 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(post.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="rounded-xl border bg-white py-8 text-center text-muted-foreground">
            No hay noticias. Crea la primera.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-white sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {categoryLabels[post.category] || post.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      post.published
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {post.published ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(post)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay noticias. Crea la primera.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
