import { NextRequest, NextResponse } from "next/server";
import { optOutOfPaymentReminders } from "@/lib/payment-reminders";

// POST only: mail clients send RFC 8058 one-click requests here, and the
// /baja page posts on button click. A GET would let link scanners unsubscribe.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!(await optOutOfPaymentReminders(token))) {
    return NextResponse.json(
      { error: "El enlace no es válido o ya venció" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
