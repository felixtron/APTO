import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf, generateTrainingCertificatePdf } from "@/lib/generate-certificate";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certId = searchParams.get("id");

  if (!certId) {
    return NextResponse.json(
      { error: "Certificate ID required" },
      { status: 400 }
    );
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: certId },
    include: { member: true, event: true },
  });

  if (!certificate || certificate.memberId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (certificate.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Certificate is not active" },
      { status: 403 }
    );
  }

  // Gate: requiere membresía activa y vigente
  const memberActive =
    certificate.member.status === "ACTIVE" &&
    (!certificate.member.subscriptionEnd ||
      certificate.member.subscriptionEnd.getTime() > Date.now());
  if (!memberActive) {
    return NextResponse.json(
      { error: "Tu membresía no está activa. Renueva tu suscripción para descargar constancias." },
      { status: 403 }
    );
  }

  const member = certificate.member;

  if (!member.memberNumber) {
    return NextResponse.json(
      { error: "No member number assigned" },
      { status: 400 }
    );
  }

  const president = await prisma.boardMember.findFirst({
    where: {
      active: true,
      title: { contains: "Presidente", mode: "insensitive" },
    },
    orderBy: { displayOrder: "asc" },
  });

  const presidentName = president?.name ?? "Mesa Directiva APTO";

  let pdfBytes: Uint8Array;
  let sha256Hash: string;

  if (certificate.type === "training" && certificate.event) {
    ({ pdfBytes, sha256Hash } = await generateTrainingCertificatePdf({
      memberName: member.name,
      memberNumber: member.memberNumber,
      certificateId: certificate.certificateId,
      eventTitle: certificate.event.title,
      eventDate: certificate.event.scheduledAt,
      presidentName,
    }));
  } else {
    const periodStart = member.createdAt;
    const periodEnd = member.subscriptionEnd ?? new Date();
    ({ pdfBytes, sha256Hash } = await generateCertificatePdf({
      memberName: member.name,
      memberNumber: member.memberNumber,
      certificateId: certificate.certificateId,
      periodStart,
      periodEnd,
      presidentName,
    }));
  }

  // Store hash if not already set
  if (!certificate.sha256Hash) {
    await prisma.certificate.update({
      where: { id: certId },
      data: { sha256Hash },
    });
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Constancia_${certificate.certificateId}.pdf"`,
    },
  });
}
