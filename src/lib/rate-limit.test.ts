import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  getClientIp,
  peekRateLimit,
  RATE_LIMITS,
  recordRateLimitHit,
  resetRateLimits,
} from "@/lib/rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests up to the limit, then blocks", () => {
    const now = 1_000_000;
    const results = Array.from({ length: 4 }, () =>
      consumeRateLimit("login:1.2.3.4", 3, 60_000, now)
    );

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBe(60);
  });

  it("opens a new window once the previous one expires", () => {
    const now = 1_000_000;
    consumeRateLimit("k", 1, 10_000, now);
    expect(consumeRateLimit("k", 1, 10_000, now + 5_000).allowed).toBe(false);

    expect(consumeRateLimit("k", 1, 10_000, now + 10_000).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    consumeRateLimit("a", 1, 10_000, 0);

    expect(consumeRateLimit("b", 1, 10_000, 0).allowed).toBe(true);
  });
});

describe("peekRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("reports the state without consuming hits", () => {
    const { limit } = RATE_LIMITS.adminLoginGlobal;
    for (let i = 0; i < limit - 1; i++) recordRateLimitHit("adminLoginGlobal", "all");

    expect(peekRateLimit("adminLoginGlobal", "all").allowed).toBe(true);
    expect(peekRateLimit("adminLoginGlobal", "all").allowed).toBe(true);

    recordRateLimitHit("adminLoginGlobal", "all");
    expect(peekRateLimit("adminLoginGlobal", "all").allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses x-real-ip, which Traefik rewrites to the real peer address", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "8.8.8.8, 203.0.113.7",
    });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("ignores a client-supplied cf-connecting-ip (site is not behind Cloudflare)", () => {
    const headers = new Headers({
      "cf-connecting-ip": "1.1.1.1",
      "x-real-ip": "203.0.113.7",
    });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for hop, then 'unknown'", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "8.8.8.8, 10.0.0.1" }))).toBe(
      "8.8.8.8"
    );
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
