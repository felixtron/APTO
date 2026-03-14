export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { DirectorySearch } from "./directory-search";

export default async function DirectorioPage() {
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      institution: true,
      specialty: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Directorio de Miembros</h1>
        <p className="text-muted-foreground">
          Encuentra colegas terapeutas ocupacionales
        </p>
      </div>

      <DirectorySearch members={members} />
    </div>
  );
}
