import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

const TEST_SECRET = "test-secret-that-is-long-enough-for-hmac-usage";

describe("signed-token", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("round-trips claims for the same purpose", () => {
    const token = createSignedToken("admin-session", { role: "admin" }, 60_000);

    const result = verifySignedToken("admin-session", token);

    expect(result.ok).toBe(true);
    expect(result.ok && result.claims.role).toBe("admin");
  });

  it("rejects a token minted for a different purpose", () => {
    const resetToken = createSignedToken(
      "password-reset",
      { email: "member@example.com" },
      60_000
    );

    const result = verifySignedToken("admin-session", resetToken);

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a token whose payload was tampered with", () => {
    const token = createSignedToken("admin-session", { role: "member" }, 60_000);
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ role: "admin", exp: Date.now() + 60_000 })
    ).toString("base64url");

    const result = verifySignedToken("admin-session", `${forgedPayload}.${signature}`);

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("reports expired tokens separately from invalid ones", () => {
    vi.useFakeTimers();
    const token = createSignedToken("password-reset", { email: "a@b.co" }, 1_000);
    vi.advanceTimersByTime(1_001);

    expect(verifySignedToken("password-reset", token)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects malformed tokens", () => {
    for (const token of ["", "abc", "a.b.c", ".sig", "payload."]) {
      expect(verifySignedToken("admin-session", token)).toEqual({
        ok: false,
        reason: "invalid",
      });
    }
  });

  it("refuses to sign when NEXTAUTH_SECRET is missing", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "");

    expect(() => createSignedToken("admin-session", { role: "admin" }, 1_000)).toThrow(
      /NEXTAUTH_SECRET/
    );
  });
});
