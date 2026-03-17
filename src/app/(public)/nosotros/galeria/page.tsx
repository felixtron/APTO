"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "Todos",
  "Taipei 2012",
  "Medellín 2016",
  "Trinidad & Tobago 2016",
  "Sapporo",
  "APTO & WFOT",
  "Miembros Honorarios",
] as const;

const gallery = [
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/e68bc0b2.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/ab0d04a8.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/a7db5bdb.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/358c423e.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/b7a95754.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/5acf6919.jpg" },
  { category: "Taipei 2012", title: "Council Meeting Taipei 2012", url: "/api/files/galeria/c8161f79.jpg" },
  { category: "Medellín 2016", title: "WFOT Council Meeting Medellín 2016", url: "/api/files/galeria/447a3a5e.jpg" },
  { category: "Trinidad & Tobago 2016", title: "Trinidad and Tobago — WFOT 2016", url: "/api/files/galeria/f550372c.jpg" },
  { category: "APTO & WFOT", title: "APTO — WFOT", url: "/api/files/galeria/e473ac29.jpg" },
  { category: "Sapporo", title: "Council Meeting Sapporo", url: "/api/files/galeria/5cfd2097.jpg" },
  { category: "Sapporo", title: "Council Meeting Sapporo", url: "/api/files/galeria/855c576c.jpg" },
  { category: "Sapporo", title: "Council Meeting Sapporo", url: "/api/files/galeria/47052cbf.jpg" },
  { category: "Sapporo", title: "Council Meeting Sapporo", url: "/api/files/galeria/fdeeed05.jpg" },
  { category: "Sapporo", title: "Council Meeting Sapporo", url: "/api/files/galeria/491dab46.jpg" },
  { category: "Miembros Honorarios", title: "Miembros Honorarios", url: "/api/files/galeria/c2fd3b55.jpg" },
];

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "Todos"
      ? gallery
      : gallery.filter((img) => img.category === activeCategory);

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function prev() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? filtered.length - 1 : lightboxIndex - 1);
  }

  function next() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === filtered.length - 1 ? 0 : lightboxIndex + 1);
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/nosotros"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Nosotros
          </Link>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Galería
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Momentos que nos definen como asociación. Nuestra participación en
            eventos internacionales de la WFOT y CLATO.
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="border-b bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-brand-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                onClick={() => openLightbox(i)}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <Image
                  src={img.url}
                  alt={img.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-sm font-medium text-white">{img.title}</p>
                  <p className="text-xs text-white/70">{img.category}</p>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No hay imágenes en esta categoría.
            </p>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Image */}
          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].url}
              alt={filtered[lightboxIndex].title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
            style={{ right: "1rem", top: "50%", transform: "translateY(-50%)" }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-medium text-white">
              {filtered[lightboxIndex].title}
            </p>
            <p className="text-xs text-white/60">
              {lightboxIndex + 1} / {filtered.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
