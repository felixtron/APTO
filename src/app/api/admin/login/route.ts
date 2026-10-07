import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAdminToken } from "@/lib/admin-auth";
import { safeEqual } from "@/lib/secure-compare";
import {
  checkRateLimit,
  getClientIp,
  peekRateLimit,
  recordRateLimitHit,
  tooManyRequests,
} from "@/lib/rate-limit";

const GLOBAL_KEY = "all";

export async function POST(request: NextRequest) {
  // Per-IP limit plus a global cap on *failed* attempts, so rotating IPs
  // cannot brute-force the single shared admin password.
  const ipLimit = checkRateLimit("adminLogin", [getClientIp(request.headers)]);
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfterSeconds);
  const globalLimit = peekRateLimit("adminLoginGlobal", GLOBAL_KEY);
  if (!globalLimit.allowed) return tooManyRequests(globalLimit.retryAfterSeconds);

  const { password } = await request.json();

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || !safeEqual(password, expected)) {
    recordRateLimitHit("adminLoginGlobal", GLOBAL_KEY);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = generateAdminToken();

  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
