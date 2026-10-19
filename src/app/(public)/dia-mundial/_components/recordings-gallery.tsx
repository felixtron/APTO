"use client";

import { useMemo, useState } from "react";
import { Search, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ALL_TOPICS_FILTER,
  RECORDING_TOPICS,
  countByTopic,
  filterRecordings,
} from "@/lib/recording-topics";
import { RecordingCard, type PublicRecording } from "./recording-card";

interface RecordingsGalleryProps {
  recordings: PublicRecording[];
}

export function RecordingsGallery({ recordings }: RecordingsGalleryProps) {
  const [activeTopic, setActiveTopic] = useState<string>(ALL_TOPICS_FILTER);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => countByTopic(recordings), [recordings]);
  const filtered = useMemo(
    () => filterRecordings(recordings, { topic: activeTopic, query }),
    [recordings, activeTopic, query]
  );
  const chips = [ALL_TOPICS_FILTER, ...RECORDING_TOPICS];

  return (
    <section id="grabaciones" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Biblioteca de conferencias
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Filtra por tema o busca por título y ponente. Cada grabación se abre
          en una pestaña nueva.
        </p>
      </div>

      {/* Filtros: fijos bajo la barra de navegación */}
      <div className="sticky top-16 z-10 mt-6 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
            <div
              role="group"
              aria-label="Filtrar por tema"
              className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-1 lg:pb-0"
            >
              {chips.map((topic) => {
                const isActive = activeTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTopic(topic)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {topic}
                    <span
                      className={`ml-1.5 text-xs ${isActive ? "text-blue-100" : "text-muted-foreground/70"}`}
                    >
                      {counts[topic] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título o ponente"
                aria-label="Buscar grabaciones"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
          {filtered.length === 1
            ? "1 grabación"
            : `${filtered.length} grabaciones`}
          {activeTopic !== ALL_TOPICS_FILTER && ` en ${activeTopic}`}
          {query && ` para “${query}”`}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-16">
            <Video className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              No hay grabaciones con ese filtro. Prueba otro tema o cambia la
              búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recording) => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
