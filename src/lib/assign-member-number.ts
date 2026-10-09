import { prisma } from "@/lib/prisma";
import {
  MEMBER_NUMBER_PREFIX,
  memberNumberSequence,
  nextMemberNumberAfter,
} from "@/lib/member-number";

// A unique-constraint race only costs a re-read, so a few attempts are plenty.
const MAX_CREATE_ATTEMPTS = 3;

/** Next free number, counting both portal members and the reserved roster. */
export async function nextMemberNumber(): Promise<string> {
  const [members, roster] = await Promise.all([
    prisma.member.findMany({
      where: { memberNumber: { startsWith: MEMBER_NUMBER_PREFIX } },
      select: { memberNumber: true },
    }),
    prisma.memberRoster.findMany({ select: { memberNumber: true } }),
  ]);
  return nextMemberNumberAfter([...members, ...roster].map((row) => row.memberNumber));
}

/** The roster number reserved for this email, unless a member already holds it. */
async function reservedMemberNumber(email: string): Promise<string | null> {
  const reserved = await prisma.memberRoster.findUnique({
    where: { email },
    select: { memberNumber: true },
  });
  if (!reserved) return null;

  const holder = await prisma.member.findUnique({
    where: { memberNumber: reserved.memberNumber },
    select: { id: true },
  });
  return holder ? null : reserved.memberNumber;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export interface MemberNumberConflict {
  message: string;
  /** Only reserved in the roster: the admin may confirm it is the same person. */
  overridable: boolean;
}

/**
 * Why an admin cannot give `memberNumber` to the member with `email`
 * (`memberId` when editing an existing one), or null if it is free to assign.
 */
export async function findMemberNumberConflict(
  memberNumber: string,
  owner: { email: string; memberId?: string },
  allowReserved: boolean
): Promise<MemberNumberConflict | null> {
  const [holder, reserved, next] = await Promise.all([
    prisma.member.findUnique({ where: { memberNumber }, select: { id: true } }),
    prisma.memberRoster.findUnique({
      where: { memberNumber },
      select: { name: true, email: true },
    }),
    nextMemberNumber(),
  ]);

  if (holder && holder.id !== owner.memberId) {
    return {
      message: `El número ${memberNumber} ya está asignado a otro miembro`,
      overridable: false,
    };
  }
  if ((memberNumberSequence(memberNumber) ?? 0) > (memberNumberSequence(next) ?? 0)) {
    return {
      message: `No se pueden saltar números: el siguiente libre es ${next}`,
      overridable: false,
    };
  }
  if (!allowReserved && reserved?.email && reserved.email !== owner.email.toLowerCase()) {
    return {
      message: `El número ${memberNumber} está reservado en el padrón para ${reserved.name}`,
      overridable: true,
    };
  }
  return null;
}

/**
 * Runs `create` with the member's number — their roster number when the
 * roster lists this email, otherwise the next free one — retrying with a
 * fresh number if a concurrent signup takes it first.
 */
export async function createWithMemberNumber<T>(
  email: string,
  create: (memberNumber: string) => Promise<T>
): Promise<{ record: T; memberNumber: string }> {
  let memberNumber = (await reservedMemberNumber(email)) ?? (await nextMemberNumber());
  for (let attempt = 1; ; attempt++) {
    try {
      return { record: await create(memberNumber), memberNumber };
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= MAX_CREATE_ATTEMPTS) throw error;
      memberNumber = await nextMemberNumber();
    }
  }
}
