import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { StripeModeToggle } from "@/components/admin/stripe-mode-toggle";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/miembros", label: "Miembros" },
  { href: "/admin/noticias", label: "Noticias" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/empleos", label: "Empleos" },
  { href: "/admin/recursos", label: "Recursos" },
  { href: "/admin/universidades", label: "Universidades" },
  { href: "/admin/mesa-directiva", label: "Mesa Directiva" },
  { href: "/admin/grabaciones", label: "Grabaciones" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-bold">
              APTO Admin
            </Link>
            <div className="hidden flex-wrap gap-3 lg:flex">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StripeModeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ver sitio
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="overflow-x-auto border-b bg-white px-4 py-2 lg:hidden">
        <div className="flex gap-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
