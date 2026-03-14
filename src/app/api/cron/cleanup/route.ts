import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      new URL(request.url).searchParams.get("token");

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Expire old job postings
    const expiredJobs = await prisma.jobPosting.updateMany({
      where: { active: true, expiresAt: { lt: new Date() } },
      data: { active: false },
    });

    // 2. Expire stale pending event registrations (> 24 hours old)
    const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredRegistrations = await prisma.eventRegistration.updateMany({
      where: { status: "PENDING", createdAt: { lt: staleDate } },
      data: { status: "EXPIRED" },
    });

    // 3. Expire old certificates
    const expiredCertificates = await prisma.certificate.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({
      expiredJobs: expiredJobs.count,
      expiredRegistrations: expiredRegistrations.count,
      expiredCertificates: expiredCertificates.count,
      cleanedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
