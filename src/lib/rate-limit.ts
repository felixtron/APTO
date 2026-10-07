import { NextResponse } from "next/server";

/**
 * In-memory fixed-window rate limiter.
 *
 * The app runs as a single container (the `apto-app` Quadlet), so process
 * memory is a shared view of all traffic. If it is ever scaled horizontally,
 * move the buckets to Postgres or Redis.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const MINUTE_MS = 60 * 1000;
const MAX_TRACKED_KEYS = 10_000;

export const RATE_LIMITS = {
  adminLogin: { limit: 10, windowMs: 15 * MINUTE_MS },
  adminLoginGlobal: { limit: 50, windowMs: 15 * MINUTE_MS },
  memberLogin: { limit: 10, windowMs: 15 * MINUTE_MS },
  passwordReset: { limit: 5, windowMs: 60 * MINUTE_MS },
  passwordResetConfirm: { limit: 20, windowMs: 60 * MINUTE_MS },
  register: { limit: 10, windowMs: 60 * MINUTE_MS },
  contact: { limit: 5, windowMs: 60 * MINUTE_MS },
  checkout: { limit: 20, windowMs: 60 * MINUTE_MS },
  eventRegister: { limit: 10, windowMs: 60 * MINUTE_MS },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;

const buckets = new Map<string, Bucket>();

/** Keeps memory bounded: drop expired buckets, then the oldest ones. */
function pruneBuckets(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  for (const key of buckets.keys()) {
    if (buckets.size < MAX_TRACKED_KEYS) break;
    buckets.delete(key);
  }
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  buckets.set(key, { count: current.count + 1, resetAt: current.resetAt });
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test helper: clears every bucket. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Client IP as seen by Traefik on propodvps2. apto.org.mx is NOT proxied by
 * Cloudflare, and Traefik only trusts forwarded headers from Cloudflare
 * ranges, so for direct traffic it discards client-sent X-Real-Ip /
 * X-Forwarded-For and rewrites them with the real peer address.
 * `cf-connecting-ip` is never rewritten, so it is ignored: any client can
 * forge it. If the domain is ever proxied through Cloudflare, switch to it.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Consumes one hit per key for the given scope (e.g. per-IP, then per-email).
 * Stops at the first blocked key, so a blocked client cannot keep minting
 * new buckets for the keys after it. Pass the IP key first.
 */
export function checkRateLimit(scope: RateLimitScope, keys: string[]): RateLimitResult {
  const { limit, windowMs } = RATE_LIMITS[scope];
  for (const key of keys) {
    const result = consumeRateLimit(`${scope}:${key}`, limit, windowMs);
    if (!result.allowed) return result;
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Reports whether a key is currently blocked, without consuming a hit. */
export function peekRateLimit(
  scope: RateLimitScope,
  key: string,
  now: number = Date.now()
): RateLimitResult {
  const { limit } = RATE_LIMITS[scope];
  const current = buckets.get(`${scope}:${key}`);
  if (!current || current.resetAt <= now || current.count < limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

/** Records one hit (e.g. a failed attempt) against a key. */
export function recordRateLimitHit(scope: RateLimitScope, key: string): void {
  const { limit, windowMs } = RATE_LIMITS[scope];
  consumeRateLimit(`${scope}:${key}`, limit, windowMs);
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Demasiados intentos. Intenta de nuevo más tarde." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
