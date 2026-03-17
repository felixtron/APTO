"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  CalendarDays,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Sparkles,
  UserCog,
  Video,
  Mail,
  ExternalLink,
} from "lucide-react";
import { StripeModeToggle } from "./stripe-mode-toggle";
import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/miembros", label: "Miembros", icon: Users },
  { href: "/admin/noticias", label: "Noticias", icon: Newspaper },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/empleos", label: "Empleos", icon: Briefcase },
  { href: "/admin/recursos", label: "Recursos", icon: FolderOpen },
  { href: "/admin/universidades", label: "Universidades", icon: GraduationCap },
  { href: "/admin/evento-especial", label: "Evento Especial", icon: Sparkles },
  { href: "/admin/mesa-directiva", label: "Mesa Directiva", icon: UserCog },
  { href: "/admin/grabaciones", label: "Grabaciones", icon: Video },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
      <Link href="/admin" className="text-lg font-bold">
        APTO Admin
      </Link>
      <div className="flex items-center gap-2">
        <StripeModeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navegación</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-brand-100 text-brand-700 font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-4 border-t pt-4">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver sitio
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
