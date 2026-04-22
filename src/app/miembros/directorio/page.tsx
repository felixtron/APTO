export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DirectorySearch } from "./directory-search";
import { getActiveMembership } from "@/lib/require-active-membership";
import { MembershipRequired } from "../_components/membership-required";

export default async function DirectorioPage() {
  const membership = await getActiveMembership();
  if (!membership) redirect("/auth/login");
  if (!membership.isActive) {
    return (
      <MembershipRequired
        sectionTitle="Directorio de Miembros"
        sectionDescription="Encuentra colegas terapeutas ocupacionales"
        memberId={membership.userId}
        memberEmail={membership.email}
        memberType={membership.memberType}
        status={membership.status}
      />
    );
  }

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
