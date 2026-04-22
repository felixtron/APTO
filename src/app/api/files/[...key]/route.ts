import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getActiveMembership } from "@/lib/require-active-membership";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Prefijos públicos: cualquier otra carpeta requiere membresía activa.
// Por seguridad preferimos whitelist — un folder nuevo queda protegido por defecto.
const PUBLIC_PREFIXES = [
  "noticias/",
  "eventos/",
  "mesa-directiva/",
  "galeria/",
  "nosotros/",
  "uploads/",
  "public/",
];

function isPublicKey(key: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const fileKey = key.join("/");

  // Guard: si no es público, requiere admin o miembro con membresía activa
  const publicFile = isPublicKey(fileKey);
  if (!publicFile) {
    const adminOk = await isAdminAuthenticated();
    if (!adminOk) {
      const membership = await getActiveMembership();
      if (!membership) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!membership.isActive) {
        return NextResponse.json(
          {
            error:
              "Membresía inactiva. Paga tu suscripción para acceder a este recurso.",
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "apto-files",
        Key: fileKey,
      })
    );

    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        // Archivos privados: no cachear en CDN/navegador compartido.
        "Cache-Control": publicFile
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
