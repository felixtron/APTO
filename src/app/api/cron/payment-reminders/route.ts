import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { sendPaymentReminders } from "@/lib/payment-reminders";

// Scheduled from the 15th of each month; `?dryRun=1` only counts recipients.
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    const result = await sendPaymentReminders({ dryRun });

    return NextResponse.json({ ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    console.error("Cron payment-reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
