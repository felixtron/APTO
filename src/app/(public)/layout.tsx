import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { prisma } from "@/lib/prisma";
import { DIA_MUNDIAL, getEventWindowStatus } from "@/lib/dia-mundial";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let specialEvent: { slug: string; navLabel: string } | null = null;
  try {
    specialEvent = await prisma.specialEvent.findFirst({
      where: { active: true },
      select: { slug: true, navLabel: true },
    });
  } catch {
    // Table may not exist yet during build
  }

  // El evento especial de la BD tiene prioridad; si no hay, promovemos el
  // Día Mundial hasta que termine su ventana de acceso libre.
  const navEvent = specialEvent
    ? { href: `/evento/${specialEvent.slug}`, label: specialEvent.navLabel }
    : getEventWindowStatus(new Date()) !== "closed"
      ? { href: DIA_MUNDIAL.path, label: DIA_MUNDIAL.navLabel }
      : null;

  return (
    <>
      <Navbar specialEvent={navEvent} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
