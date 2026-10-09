import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  member: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
}));
const batchSend = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/resend", () => ({ getResend: () => ({ batch: { send: batchSend } }) }));

import {
  MAX_REMINDERS_PER_RUN,
  optOutOfPaymentReminders,
  reminderRecipientsWhere,
  sendPaymentReminders,
} from "@/lib/payment-reminders";
import { createSignedToken } from "@/lib/signed-token";

const now = new Date("2026-10-15T16:00:00Z");

function member(n: number) {
  return {
    id: `m${n}`,
    email: `socio${n}@example.com`,
    name: `Socio ${n}`,
    memberNumber: `LTO${String(n).padStart(4, "0")}`,
    passwordHash: `$2b$10$hash${n}`,
    passwordSetAt: null as Date | null,
  };
}

describe("reminderRecipientsWhere", () => {
  it("targets members without an active membership who did not opt out", () => {
    const where = reminderRecipientsWhere(now);

    expect(where.paymentReminderOptOut).toBe(false);
    expect(where.AND).toContainEqual({
      OR: [{ status: { not: "ACTIVE" } }, { subscriptionEnd: { lte: now } }],
    });
  });

  it("skips members already reminded in the last 20 days", () => {
    const where = reminderRecipientsWhere(now);

    expect(where.AND).toContainEqual({
      OR: [
        { lastPaymentReminderAt: null },
        { lastPaymentReminderAt: { lt: new Date("2026-09-25T16:00:00Z") } },
      ],
    });
  });
});

describe("sendPaymentReminders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-that-is-long-enough-for-hmac-usage");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("only counts recipients on a dry run", async () => {
    db.member.count.mockResolvedValue(117);
    db.member.findMany.mockResolvedValue([member(1)]);

    const result = await sendPaymentReminders({ now, dryRun: true });

    expect(result).toEqual({ dryRun: true, eligible: 117, sent: 0, failed: 0 });
    expect(batchSend).not.toHaveBeenCalled();
  });

  it("caps each run below Resend's 100 emails a day", async () => {
    db.member.count.mockResolvedValue(117);
    db.member.findMany.mockResolvedValue([]);

    await sendPaymentReminders({ now });

    expect(MAX_REMINDERS_PER_RUN).toBeLessThan(100);
    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: MAX_REMINDERS_PER_RUN })
    );
  });

  it("sends one personalised email per member with one-click unsubscribe", async () => {
    db.member.count.mockResolvedValue(2);
    db.member.findMany.mockResolvedValue([member(1), member(2)]);
    batchSend.mockResolvedValue({ data: { data: [{ id: "e1" }, { id: "e2" }] }, error: null });

    const result = await sendPaymentReminders({ now });

    const [emails, options] = batchSend.mock.calls[0];
    expect(emails).toHaveLength(2);
    expect(emails[0].to).toBe("socio1@example.com");
    expect(emails[0].text).toContain("LTO0001");
    expect(emails[0].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(options.idempotencyKey).toMatch(/^payment-reminders-2026-10-15-/);
    expect(result).toEqual({ dryRun: false, eligible: 2, sent: 2, failed: 0 });
  });

  it("marks rejected addresses too, so they wait until next month", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.member.count.mockResolvedValue(2);
    db.member.findMany.mockResolvedValue([member(1), member(2)]);
    batchSend.mockResolvedValue({
      data: { data: [{ id: "e1" }], errors: [{ index: 1, message: "invalid" }] },
      error: null,
    });

    const result = await sendPaymentReminders({ now });

    expect(db.member.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["m1", "m2"] } },
      data: { lastPaymentReminderAt: now },
    });
    expect(result).toMatchObject({ sent: 1, failed: 1 });
  });

  it("only includes the password setup link for accounts never claimed", async () => {
    db.member.count.mockResolvedValue(2);
    db.member.findMany.mockResolvedValue([
      member(1),
      { ...member(2), passwordSetAt: new Date("2026-01-01") },
    ]);
    batchSend.mockResolvedValue({ data: { data: [{ id: "e1" }, { id: "e2" }] }, error: null });

    await sendPaymentReminders({ now });

    const [emails] = batchSend.mock.calls[0];
    expect(emails[0].text).toContain("reset-password");
    expect(emails[1].text).not.toContain("reset-password");
    expect(emails[1].text).toContain("/auth/forgot-password");
  });

  it("retries recording the send before giving up", async () => {
    db.member.count.mockResolvedValue(1);
    db.member.findMany.mockResolvedValue([member(1)]);
    batchSend.mockResolvedValue({ data: { data: [{ id: "e1" }] }, error: null });
    db.member.updateMany.mockRejectedValueOnce(new Error("db hiccup")).mockResolvedValue({});

    await sendPaymentReminders({ now });

    expect(db.member.updateMany).toHaveBeenCalledTimes(2);
  });

  it("marks nobody when the whole batch fails", async () => {
    db.member.count.mockResolvedValue(1);
    db.member.findMany.mockResolvedValue([member(1)]);
    batchSend.mockResolvedValue({
      data: null,
      error: { name: "daily_quota_exceeded", message: "quota" },
    });

    await expect(sendPaymentReminders({ now })).rejects.toThrow("daily_quota_exceeded");
    expect(db.member.updateMany).not.toHaveBeenCalled();
  });
});

describe("optOutOfPaymentReminders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-that-is-long-enough-for-hmac-usage");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("opts the member in the token out", async () => {
    const token = createSignedToken("email-unsubscribe", { sub: "m1" }, 60_000);

    expect(await optOutOfPaymentReminders(token)).toBe(true);
    expect(db.member.updateMany).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { paymentReminderOptOut: true },
    });
  });

  it("rejects a token minted for another purpose", async () => {
    const token = createSignedToken("password-reset", { sub: "m1" }, 60_000);

    expect(await optOutOfPaymentReminders(token)).toBe(false);
    expect(db.member.updateMany).not.toHaveBeenCalled();
  });
});
