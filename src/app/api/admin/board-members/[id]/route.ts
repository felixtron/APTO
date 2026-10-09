import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isAcceptedSignatureUrl } from "@/lib/certificate-signatory";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();
  // Absent leaves the signature as is; null or "" removes it.
  const signatureUrl = data.signatureUrl === undefined ? undefined : data.signatureUrl || null;
  if (signatureUrl !== undefined && !isAcceptedSignatureUrl(signatureUrl)) {
    return NextResponse.json(
      { error: "La firma debe subirse desde el panel (carpeta de firmas)." },
      { status: 400 }
    );
  }

  const member = await prisma.boardMember.update({
    where: { id },
    data: {
      name: data.name,
      title: data.title,
      role: data.role || null,
      bio: data.bio ?? undefined,
      photoUrl: data.photoUrl ?? undefined,
      signatureUrl,
      displayOrder: data.displayOrder ?? undefined,
    },
  });

  return NextResponse.json(member);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.boardMember.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
