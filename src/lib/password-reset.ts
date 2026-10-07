import crypto from "crypto";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

export const SELF_SERVICE_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const ADMIN_ISSUED_RESET_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type ResetTokenResult =
  | { ok: true; email: string; fingerprint: string }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Short digest of the current password hash. Embedding it in the token makes
 * the link single-use: once the password changes, the fingerprint no longer
 * matches and the token stops working.
 */
function passwordFingerprint(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function createPasswordResetToken(
  member: { email: string; passwordHash: string },
  ttlMs: number
): string {
  return createSignedToken(
    "password-reset",
    { email: member.email, pwd: passwordFingerprint(member.passwordHash) },
    ttlMs
  );
}

export function verifyPasswordResetToken(token: string): ResetTokenResult {
  const result = verifySignedToken("password-reset", token);
  if (!result.ok) return result;

  const { email, pwd } = result.claims;
  if (typeof email !== "string" || typeof pwd !== "string") {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, email, fingerprint: pwd };
}

export function isResetTokenCurrent(
  token: { fingerprint: string },
  currentPasswordHash: string
): boolean {
  return token.fingerprint === passwordFingerprint(currentPasswordHash);
}

export function buildResetUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
  return `${baseUrl}/auth/reset-password?token=${token}`;
}
