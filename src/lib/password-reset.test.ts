import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPasswordResetToken,
  isResetTokenCurrent,
  verifyPasswordResetToken,
} from "@/lib/password-reset";

const member = {
  email: "member@example.com",
  passwordHash: "$2a$12$originalhashoriginalhashorig",
};

describe("password-reset tokens", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-that-is-long-enough-for-hmac-usage");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verifies a token for the member it was issued to", () => {
    const token = createPasswordResetToken(member, 60_000);

    const result = verifyPasswordResetToken(token);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.email).toBe(member.email);
    expect(isResetTokenCurrent(result, member.passwordHash)).toBe(true);
  });

  it("is single-use: stops matching once the password changes", () => {
    const token = createPasswordResetToken(member, 60_000);
    const result = verifyPasswordResetToken(token);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isResetTokenCurrent(result, "$2a$12$newhashnewhashnewhashnewhas")).toBe(false);
  });

  it("rejects an admin-session token", async () => {
    const { createSignedToken } = await import("@/lib/signed-token");
    const adminToken = createSignedToken("admin-session", { role: "admin" }, 60_000);

    expect(verifyPasswordResetToken(adminToken)).toEqual({ ok: false, reason: "invalid" });
  });
});
