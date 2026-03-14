"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  Send,
  Eye,
  Sparkles,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";

// ─── Top-level action buttons ───

export function NewsletterActions() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create manually
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // AI generation
  const [topic, setTopic] = useState("");

  async function handleCreate() {
    if (!subject.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });
      setShowCreate(false);
      setSubject("");
      setContent("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al generar");
        return;
      }
      setShowGenerate(false);
      setTopic("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowGenerate(true)}>
          <Sparkles className="mr-1 h-4 w-4" />
          Generar con IA
        </Button>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo boletín
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo boletín</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nl-subject">Asunto</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Boletín APTO - Marzo 2025"
              />
            </div>
            <div>
              <Label htmlFor="nl-content">Contenido (HTML)</Label>
              <Textarea
                id="nl-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="<p>Estimados miembros...</p>"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Crear borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar boletín con IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gemini generará un boletín basado en las noticias y eventos
              recientes de APTO. Opcionalmente indica un tema específico.
            </p>
            <div>
              <Label htmlFor="ai-topic">Tema (opcional)</Label>
              <Input
                id="ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Día Mundial de la Terapia Ocupacional"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {loading ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Row actions (preview, edit, send, delete) ───

export function NewsletterRowActions({
  id,
  status,
  subject,
  content,
}: {
  id: string;
  status: string;
  subject: string;
  content: string;
}) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editSubject, setEditSubject] = useState(subject);
  const [editContent, setEditContent] = useState(content);

  async function handleUpdate() {
    setLoading(true);
    try {
      await fetch(`/api/admin/newsletter/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, content: editContent }),
      });
      setShowEdit(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al enviar");
        return;
      }
      setShowSendConfirm(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este boletín?")) return;
    await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const isDraft = status === "DRAFT" || status === "FAILED";

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Ver
        </Button>
        {isDraft && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditSubject(subject);
                setEditContent(content);
                setShowEdit(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSendConfirm(true)}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              Enviar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{subject}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cerrar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar boletín</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor={`edit-subject-${id}`}>Asunto</Label>
              <Input
                id={`edit-subject-${id}`}
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`edit-content-${id}`}>Contenido (HTML)</Label>
              <Textarea
                id={`edit-content-${id}`}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirmation dialog */}
      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envío</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Enviar el boletín <strong>&quot;{subject}&quot;</strong> a todos
            los miembros activos? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleSend} disabled={loading}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar ahora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
