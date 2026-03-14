export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      institution: true,
      cedula: true,
      specialty: true,
      memberNumber: true,
    },
  });

  if (!member) redirect("/auth/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Actualiza tu información personal
        </p>
      </div>
      <ProfileForm member={member} />
    </div>
  );
}
