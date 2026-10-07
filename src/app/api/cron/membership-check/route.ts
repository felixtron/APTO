import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.member.updateMany({
      where: {
        status: "ACTIVE",
        subscriptionEnd: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({
      expired: result.count,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron membership-check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
