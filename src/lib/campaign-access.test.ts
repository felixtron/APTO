import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value === undefined ? undefined : { name, value };
    },
  }),
}));

import {
  CAMPAIGN_ACCESS_COOKIE,
  campaignAccessCookieOptions,
  createCampaignAccessToken,
  getCampaignAccess,
  getCampaignAccessTtlMs,
  verifyCampaignAccessToken,
} from "@/lib/campaign-access";

const DAY_MS = 24 * 60 * 60 * 1000;
const CAMPAIGN = "dia-mundial-2026";

describe("campaign access", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-that-is-long-enough-for-hmac-usage");
    cookieStore.clear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("round-trips the registration id for the same campaign", () => {
    const token = createCampaignAccessToken({ registrationId: "reg_1", campaign: CAMPAIGN }, DAY_MS);
    expect(verifyCampaignAccessToken(token, CAMPAIGN)).toBe("reg_1");
  });

  it("rejects a token from another campaign", () => {
    const token = createCampaignAccessToken({ registrationId: "reg_1", campaign: "otra" }, DAY_MS);
    expect(verifyCampaignAccessToken(token, CAMPAIGN)).toBeNull();
  });

  it("rejects tampered and expired tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T12:00:00Z"));
    const token = createCampaignAccessToken({ registrationId: "reg_1", campaign: CAMPAIGN }, 1000);
    expect(verifyCampaignAccessToken(`${token}x`, CAMPAIGN)).toBeNull();
    vi.setSystemTime(new Date("2026-10-27T12:00:02Z"));
    expect(verifyCampaignAccessToken(token, CAMPAIGN)).toBeNull();
  });

  it("does not accept a token minted for another purpose", async () => {
    const { createSignedToken } = await import("@/lib/signed-token");
    const token = createSignedToken("admin-session", { registrationId: "x", campaign: CAMPAIGN }, DAY_MS);
    expect(verifyCampaignAccessToken(token, CAMPAIGN)).toBeNull();
  });

  describe("getCampaignAccessTtlMs", () => {
    const config = { endsOn: "2026-10-31" };

    it("lasts until a week after the event ends before the event", () => {
      const ttl = getCampaignAccessTtlMs(new Date("2026-10-19T12:00:00Z"), config);
      const expected = new Date("2026-11-07T23:59:59-06:00").getTime() - new Date("2026-10-19T12:00:00Z").getTime();
      expect(ttl).toBe(expected);
    });

    it("never goes below one day, even long after the event", () => {
      expect(getCampaignAccessTtlMs(new Date("2027-03-01T00:00:00Z"), config)).toBe(DAY_MS);
    });
  });

  it("builds secure httpOnly cookie options in seconds", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(campaignAccessCookieOptions(2 * DAY_MS)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 24 * 60 * 60,
    });
  });

  describe("getCampaignAccess", () => {
    it("is not registered without a cookie", async () => {
      expect(await getCampaignAccess(CAMPAIGN)).toEqual({ registered: false, registrationId: null });
    });

    it("is registered with a valid cookie", async () => {
      cookieStore.set(
        CAMPAIGN_ACCESS_COOKIE,
        createCampaignAccessToken({ registrationId: "reg_9", campaign: CAMPAIGN }, DAY_MS)
      );
      expect(await getCampaignAccess(CAMPAIGN)).toEqual({ registered: true, registrationId: "reg_9" });
    });

    it("fails closed with a garbage cookie", async () => {
      cookieStore.set(CAMPAIGN_ACCESS_COOKIE, "basura");
      expect((await getCampaignAccess(CAMPAIGN)).registered).toBe(false);
    });
  });
});
