import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));

const { generateAdminToken, isAdminAuthenticated } = await import("@/lib/admin-auth");
const { createPasswordResetToken } = await import("@/lib/password-reset");

describe("isAdminAuthenticated", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-that-is-long-enough-for-hmac-usage");
    cookieJar.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a freshly generated admin token", async () => {
    cookieJar.set("admin_token", generateAdminToken());

    await expect(isAdminAuthenticated()).resolves.toBe(true);
  });

  it("rejects a password-reset token used as the admin cookie", async () => {
    const resetToken = createPasswordResetToken(
      { email: "member@example.com", passwordHash: "$2a$12$abcdefghijklmnopqrstuv" },
      60_000
    );
    cookieJar.set("admin_token", resetToken);

    await expect(isAdminAuthenticated()).resolves.toBe(false);
  });

  it("rejects requests without a cookie", async () => {
    await expect(isAdminAuthenticated()).resolves.toBe(false);
  });

  it("fails closed when the signing secret is missing", async () => {
    cookieJar.set("admin_token", generateAdminToken());
    vi.stubEnv("NEXTAUTH_SECRET", "");

    await expect(isAdminAuthenticated()).resolves.toBe(false);
  });
});
