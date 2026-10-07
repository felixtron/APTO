import type { NextRequest } from "next/server";
import { safeEqual } from "@/lib/secure-compare";

/**
 * Validates the cron secret from `Authorization: Bearer <secret>` (preferred)
 * or the legacy `?token=` query param. Fails closed when CRON_SECRET is
 * unset, so an empty secret can never match an empty token.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.nextUrl.searchParams.get("token") ||
    "";

  return safeEqual(token, secret);
}
