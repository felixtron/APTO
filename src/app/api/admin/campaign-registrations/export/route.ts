import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { registrationsToCsv } from "@/lib/campaign-registration";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.campaignRegistration.findMany({
    where: { campaign: DIA_MUNDIAL.campaign },
    orderBy: { createdAt: "asc" },
    select: { name: true, email: true, acceptsEmails: true, createdAt: true },
  });

  return new NextResponse(registrationsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registros-${DIA_MUNDIAL.campaign}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
