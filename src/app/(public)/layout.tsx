import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { prisma } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const specialEvent = await prisma.specialEvent.findFirst({
    where: { active: true },
    select: { slug: true, navLabel: true },
  });

  return (
    <>
      <Navbar
        specialEvent={
          specialEvent
            ? { href: `/evento/${specialEvent.slug}`, label: specialEvent.navLabel }
            : null
        }
      />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
