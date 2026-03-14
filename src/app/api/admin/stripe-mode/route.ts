import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { StripeMode } from "@/lib/stripe";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const mode = cookieStore.get("stripe_mode")?.value || process.env.STRIPE_MODE || "test";

  return NextResponse.json({ mode });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await request.json();

  if (mode !== "test" && mode !== "live") {
    return NextResponse.json(
      { error: "Mode must be 'test' or 'live'" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("stripe_mode", mode as StripeMode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return NextResponse.json({ mode });
}
