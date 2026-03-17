"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/eventos", label: "Eventos" },
  { href: "/noticias", label: "Noticias" },
  { href: "/recursos", label: "Recursos" },
  { href: "/contacto", label: "Contacto" },
];

interface NavbarProps {
  specialEvent?: { href: string; label: string } | null;
}

export function Navbar({ specialEvent }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logoAPTO.png"
            alt="APTO"
            width={140}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          {specialEvent && (
            <Link
              href={specialEvent.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {specialEvent.label}
            </Link>
          )}
          <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
            Iniciar Sesión
          </Button>
          <Button size="sm" render={<Link href="/membresia" />}>
            Únete
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-6 pt-6">
              <Link href="/" onClick={() => setOpen(false)}>
                <Image
                  src="/logo/logoAPTO.png"
                  alt="APTO"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                {specialEvent && (
                  <Link
                    href={specialEvent.href}
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
                  >
                    <Sparkles className="h-4 w-4" />
                    {specialEvent.label}
                  </Link>
                )}
              </nav>
              <div className="flex flex-col gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  render={<Link href="/auth/login" onClick={() => setOpen(false)} />}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  render={<Link href="/membresia" onClick={() => setOpen(false)} />}
                >
                  Únete a APTO
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
