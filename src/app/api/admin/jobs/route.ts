import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const job = await prisma.jobPosting.create({
    data: {
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type || "FULL_TIME",
      description: data.description,
      requirements: data.requirements || null,
      salary: data.salary || null,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      active: data.active ?? true,
      membersOnly: data.membersOnly ?? false,
      expiresAt: new Date(data.expiresAt),
    },
  });

  return NextResponse.json(job, { status: 201 });
}
