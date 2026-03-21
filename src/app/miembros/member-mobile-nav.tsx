"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, ExternalLink, LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Video,
  Award,
  Users,
  UserCircle,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signOut } from "next-auth/react";

const memberLinks = [
  { href: "/miembros", label: "Dashboard", icon: LayoutDashboard },
  { href: "/miembros/grabaciones", label: "Grabaciones", icon: Video },
  { href: "/miembros/constancias", label: "Constancias", icon: Award },
  { href: "/miembros/directorio", label: "Directorio", icon: Users },
  { href: "/miembros/bolsa-trabajo", label: "Bolsa de Trabajo", icon: Briefcase },
  { href: "/miembros/perfil", label: "Mi Perfil", icon: UserCircle },
];

interface MemberMobileNavProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function MemberMobileNav({ userName, userEmail }: MemberMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/miembros") return pathname === "/miembros";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
      <Link href="/">
        <Image
          src="/logo/logoAPTO.png"
          alt="APTO"
          width={100}
          height={40}
          className="h-8 w-auto"
        />
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Mi Cuenta</SheetTitle>
          </SheetHeader>
          {(userName || userEmail) && (
            <div className="mb-2 px-5">
              {userName && (
                <p className="text-sm font-medium">{userName}</p>
              )}
              {userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          )}
          <nav className="flex flex-col gap-1 px-2">
            {memberLinks.map((link) => {
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
            <div className="mt-4 border-t pt-4 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Ver sitio
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
