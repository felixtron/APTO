import crypto from "crypto";
import { safeEqual } from "@/lib/secure-compare";

export type TokenPurpose = "admin-session" | "password-reset";

export type TokenClaims = Record<string, unknown>;

export type VerifyResult =
  | { ok: true; claims: TokenClaims }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Derives a distinct HMAC key per purpose, so a token minted for one flow
 * (e.g. a password-reset link) can never verify in another (e.g. the admin
 * session cookie).
 */
function getSigningKey(purpose: TokenPurpose): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }
  return crypto.createHmac("sha256", secret).update(`apto:${purpose}`).digest();
}

function sign(purpose: TokenPurpose, payload: string): string {
  return crypto
    .createHmac("sha256", getSigningKey(purpose))
    .update(payload)
    .digest("hex");
}

export function createSignedToken(
  purpose: TokenPurpose,
  claims: TokenClaims,
  ttlMs: number
): string {
  const payload = JSON.stringify({ ...claims, exp: Date.now() + ttlMs });
  return `${Buffer.from(payload).toString("base64url")}.${sign(purpose, payload)}`;
}

export function verifySignedToken(purpose: TokenPurpose, token: string): VerifyResult {
  const parts = token.split(".");
  const [payloadB64, signature] = parts;
  if (parts.length !== 2 || !payloadB64 || !signature) {
    return { ok: false, reason: "invalid" };
  }

  const payload = Buffer.from(payloadB64, "base64url").toString();
  if (!safeEqual(signature, sign(purpose, payload))) {
    return { ok: false, reason: "invalid" };
  }

  let claims: unknown;
  try {
    claims = JSON.parse(payload);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (typeof claims !== "object" || claims === null) {
    return { ok: false, reason: "invalid" };
  }

  const { exp } = claims as TokenClaims;
  if (typeof exp !== "number") {
    return { ok: false, reason: "invalid" };
  }
  if (Date.now() >= exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, claims: claims as TokenClaims };
}
