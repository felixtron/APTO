"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
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

const BASE_SIZE = 40;
const MAX_SIZE = 56;
const MAGNIFICATION_RANGE = 120; // px range around cursor for magnification

export function AdminSidebar() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/admin") return pathname === "/admin";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    function handleMouseMove(e: MouseEvent) {
      const dockRect = dock!.getBoundingClientRect();
      const mouseY = e.clientY;

      itemRefs.current.forEach((item) => {
        if (!item) return;
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(mouseY - itemCenter);

        let scale: number;
        if (distance > MAGNIFICATION_RANGE) {
          scale = 1;
        } else {
          const ratio = 1 - distance / MAGNIFICATION_RANGE;
          scale = 1 + ratio * ((MAX_SIZE - BASE_SIZE) / BASE_SIZE);
        }

        gsap.to(item, {
          scale,
          duration: 0.3,
          ease: "power2.out",
          overwrite: true,
        });
      });
    }

    function handleMouseLeave() {
      itemRefs.current.forEach((item) => {
        if (!item) return;
        gsap.to(item, {
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.5)",
          overwrite: true,
        });
      });
    }

    dock.addEventListener("mousemove", handleMouseMove);
    dock.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      dock.removeEventListener("mousemove", handleMouseMove);
      dock.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <aside className="hidden lg:flex flex-col items-center w-16 border-r bg-white py-4 gap-1">
      {/* Logo / brand mark */}
      <Link
        href="/admin"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white"
      >
        A
      </Link>

      {/* Dock */}
      <div
        ref={dockRef}
        className="flex flex-1 flex-col items-center gap-1 py-2"
      >
        {adminLinks.map((link, i) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                active
                  ? "bg-brand-100 text-brand-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={link.label}
            >
              <Icon className="h-5 w-5" />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {link.label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span className="absolute -left-1 h-1.5 w-1.5 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom: view site link */}
      <div className="mt-auto flex flex-col items-center gap-2 pt-4 border-t">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Ver sitio"
        >
          <ExternalLink className="h-5 w-5" />
        </Link>
      </div>
    </aside>
  );
}
