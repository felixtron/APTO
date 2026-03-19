import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { generateAdminToken } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const expected = process.env.ADMIN_PASSWORD || "";
  const passwordBuf = Buffer.from(password || "");
  const expectedBuf = Buffer.from(expected);

  if (
    passwordBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(passwordBuf, expectedBuf)
  ) {
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
