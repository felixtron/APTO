import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  Video,
  Award,
  Users,
  UserCircle,
  Briefcase,
} from "lucide-react";
import { LogoutButton } from "./logout-button";

const sidebarLinks = [
  { href: "/miembros", label: "Dashboard", icon: LayoutDashboard },
  { href: "/miembros/grabaciones", label: "Grabaciones", icon: Video },
  { href: "/miembros/constancias", label: "Constancias", icon: Award },
  { href: "/miembros/directorio", label: "Directorio", icon: Users },
  { href: "/miembros/bolsa-trabajo", label: "Bolsa de Trabajo", icon: Briefcase },
  { href: "/miembros/perfil", label: "Mi Perfil", icon: UserCircle },
];

export default async function MiembrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Link href="/">
              <Image
                src="/logo/logoAPTO.png"
                alt="APTO"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-muted/30">
        {/* Mobile header */}
        <div className="border-b bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                src="/logo/logoAPTO.png"
                alt="APTO"
                width={100}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <LogoutButton variant="mobile" />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
