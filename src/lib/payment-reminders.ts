import { createHash } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { APP_URL, FROM_ADDRESS } from "@/lib/emails";
import { buildPaymentReminderEmail } from "@/lib/payment-reminder-email";
import {
  ADMIN_ISSUED_RESET_TTL_MS,
  buildResetUrl,
  createPasswordResetToken,
} from "@/lib/password-reset";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

const DAY_MS = 24 * 60 * 60 * 1000;

// Resend's free plan allows 100 emails a day, shared with password resets and
// welcome emails, so each run leaves room for those.
export const MAX_REMINDERS_PER_RUN = 80;
// The cron runs on several days from the 15th; this keeps it to one per month.
const REMINDER_INTERVAL_MS = 20 * DAY_MS;
const UNSUBSCRIBE_LINK_TTL_MS = 365 * DAY_MS;
const MARK_ATTEMPTS = 3;

interface ReminderRecipient {
  id: string;
  email: string;
  name: string;
  memberNumber: string | null;
  passwordHash: string;
  passwordSetAt: Date | null;
}

export interface ReminderRunResult {
  dryRun: boolean;
  /** Members due a reminder this cycle, before the daily cap. */
  eligible: number;
  sent: number;
  failed: number;
}

/** Members without an active membership (same rule as getActiveMembership) not reminded this cycle. */
export function reminderRecipientsWhere(now: Date): Prisma.MemberWhereInput {
  return {
    paymentReminderOptOut: false,
    AND: [
      { OR: [{ status: { not: "ACTIVE" } }, { subscriptionEnd: { lte: now } }] },
      {
        OR: [
          { lastPaymentReminderAt: null },
          { lastPaymentReminderAt: { lt: new Date(now.getTime() - REMINDER_INTERVAL_MS) } },
        ],
      },
    ],
  };
}

function toBatchEmail(member: ReminderRecipient) {
  const unsubscribeToken = createSignedToken(
    "email-unsubscribe",
    { sub: member.id },
    UNSUBSCRIBE_LINK_TTL_MS
  );
  const message = buildPaymentReminderEmail({
    name: member.name,
    memberNumber: member.memberNumber,
    // A reusable setup link in a monthly bulk email is only worth the risk for
    // accounts nobody has claimed yet; everyone else uses forgot-password.
    passwordSetupUrl: member.passwordSetAt
      ? null
      : buildResetUrl(createPasswordResetToken(member, ADMIN_ISSUED_RESET_TTL_MS)),
    unsubscribeUrl: `${APP_URL}/baja?token=${unsubscribeToken}`,
  });
  return {
    from: FROM_ADDRESS,
    to: member.email,
    ...message,
    // One-click unsubscribe (RFC 8058) keeps the domain in good standing with Gmail/Yahoo.
    headers: {
      "List-Unsubscribe": `<${APP_URL}/api/members/unsubscribe?token=${unsubscribeToken}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/** Same day and same recipients → same key, so a retried run cannot send twice. */
function idempotencyKey(now: Date, members: readonly ReminderRecipient[]): string {
  const ids = createHash("sha256")
    .update(members.map((member) => member.id).join(","))
    .digest("hex")
    .slice(0, 16);
  return `payment-reminders-${now.toISOString().slice(0, 10)}-${ids}`;
}

/** Sends up to MAX_REMINDERS_PER_RUN reminders; the next run picks up the rest. */
export async function sendPaymentReminders({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<ReminderRunResult> {
  const where = reminderRecipientsWhere(now);
  const [eligible, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: [
        { lastPaymentReminderAt: { sort: "asc", nulls: "first" } },
        { createdAt: "asc" },
      ],
      take: MAX_REMINDERS_PER_RUN,
      select: {
        id: true,
        email: true,
        name: true,
        memberNumber: true,
        passwordHash: true,
        passwordSetAt: true,
      },
    }),
  ]);
  if (dryRun || members.length === 0) return { dryRun, eligible, sent: 0, failed: 0 };

  const { data, error } = await getResend().batch.send(members.map(toBatchEmail), {
    batchValidation: "permissive",
    idempotencyKey: idempotencyKey(now, members),
  });
  if (error) {
    throw new Error(`Resend batch failed: ${error.name} ${error.message}`);
  }

  const failures = data.errors ?? [];
  for (const failure of failures) {
    console.error("Payment reminder rejected", {
      memberId: members[failure.index]?.id,
      message: failure.message,
    });
  }

  // Rejected addresses are marked too: they wait for next month instead of
  // taking slots from everyone else on every run.
  await markReminded(members.map((member) => member.id), now);
  return { dryRun, eligible, sent: members.length - failures.length, failed: failures.length };
}

/** Retries the bookkeeping: losing it would email the same people again tomorrow. */
async function markReminded(ids: string[], now: Date): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.member.updateMany({
        where: { id: { in: ids } },
        data: { lastPaymentReminderAt: now },
      });
      return;
    } catch (error) {
      if (attempt >= MARK_ATTEMPTS) {
        console.error("Payment reminders sent but not recorded", { ids });
        throw error;
      }
    }
  }
}

/** Applies an unsubscribe link; false when the token is invalid or expired. */
export async function optOutOfPaymentReminders(token: string): Promise<boolean> {
  const result = verifySignedToken("email-unsubscribe", token);
  if (!result.ok || typeof result.claims.sub !== "string") return false;

  await prisma.member.updateMany({
    where: { id: result.claims.sub },
    data: { paymentReminderOptOut: true },
  });
  return true;
}
