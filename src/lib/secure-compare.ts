import crypto from "crypto";

/**
 * Constant-time string comparison. Both inputs are hashed first so the
 * comparison never short-circuits on length and leaks it via timing.
 */
export function safeEqual(a: string, b: string): boolean {
  const aDigest = crypto.createHash("sha256").update(a).digest();
  const bDigest = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aDigest, bDigest);
}
