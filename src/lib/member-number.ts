import { z } from "zod";

/** Membership numbers follow the association's roster: "LTO" + 4-digit sequence. */
export const MEMBER_NUMBER_PREFIX = "LTO";
const SEQUENCE_DIGITS = 4;
// Six digits leaves room for growth while rejecting absurd typed values.
const MEMBER_NUMBER_PATTERN = /^LTO(\d{1,6})$/;

export function formatMemberNumber(sequence: number): string {
  return `${MEMBER_NUMBER_PREFIX}${sequence.toString().padStart(SEQUENCE_DIGITS, "0")}`;
}

/** Sequence of a canonical number ("LTO0012" → 12); null for legacy or empty values. */
export function memberNumberSequence(value: string | null): number | null {
  const match = value?.match(MEMBER_NUMBER_PATTERN);
  return match ? Number(match[1]) : null;
}

/** Canonical form of a typed number ("lto 12 " → "LTO0012"), or null if it is not one. */
export function normalizeMemberNumber(value: string): string | null {
  const sequence = memberNumberSequence(value.replace(/\s+/g, "").toUpperCase());
  return sequence ? formatMemberNumber(sequence) : null;
}

/** The number that follows the highest canonical one in `numbers`. */
export function nextMemberNumberAfter(numbers: readonly (string | null)[]): string {
  const highest = numbers.reduce(
    (max, value) => Math.max(max, memberNumberSequence(value) ?? 0),
    0
  );
  return formatMemberNumber(highest + 1);
}

export const memberNumberSchema = z
  .string({ error: "Número de socio inválido" })
  .transform((value, ctx) => {
    const normalized = normalizeMemberNumber(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Número de socio inválido (formato LTO0000)",
      });
      return z.NEVER;
    }
    return normalized;
  });
