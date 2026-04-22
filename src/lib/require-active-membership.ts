import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ActiveMembershipResult {
  userId: string;
  isActive: boolean;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
  memberType: "PROFESSIONAL" | "STUDENT";
  email: string;
  subscriptionEnd: Date | null;
}

/**
 * Lee la sesión + estado de membresía.
 * No redirige: la página decide qué mostrar cuando `isActive === false`.
 * Para API routes, devuelve `null` si no hay sesión.
 */
export async function getActiveMembership(): Promise<ActiveMembershipResult | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      subscriptionEnd: true,
    },
  });

  if (!member) return null;

  const notExpiredByDate =
    !member.subscriptionEnd || member.subscriptionEnd.getTime() > Date.now();

  return {
    userId: member.id,
    isActive: member.status === "ACTIVE" && notExpiredByDate,
    status: member.status,
    memberType: member.type,
    email: member.email,
    subscriptionEnd: member.subscriptionEnd,
  };
}
