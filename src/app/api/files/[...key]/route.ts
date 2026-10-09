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

// Solo el admin puede verlos (la firma autógrafa de la presidencia).
const ADMIN_ONLY_PREFIXES = ["firmas/"];

// Tipos que el navegador puede mostrar en línea. Cualquier otro se fuerza a
// descarga para que un HTML/SVG almacenado nunca se ejecute en nuestro origen.
const INLINE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
]);

function isPublicKey(key: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isAdminOnlyKey(key: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isWellFormedKey(key: string): boolean {
  return key.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function buildHeaders(
  object: {
    ContentType?: string;
    ContentLength?: number;
    ContentRange?: string;
    ETag?: string;
    LastModified?: Date;
  },
  publicFile: boolean
): Headers {
  const contentType = object.ContentType || "application/octet-stream";
  const mimeType = contentType.split(";")[0].trim().toLowerCase();

  const headers = new Headers({
    "Content-Type": contentType,
    // Archivos privados: no cachear en CDN/navegador compartido.
    "Cache-Control": publicFile ? "public, max-age=31536000, immutable" : "private, no-store",
    "Content-Disposition": INLINE_CONTENT_TYPES.has(mimeType) ? "inline" : "attachment",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });
  if (object.ContentLength !== undefined) {
    headers.set("Content-Length", String(object.ContentLength));
  }
  if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
  if (object.ETag) headers.set("ETag", object.ETag);
  if (object.LastModified) headers.set("Last-Modified", object.LastModified.toUTCString());
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const fileKey = key.join("/");

  if (!isWellFormedKey(fileKey)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Guard: si no es público, requiere admin o miembro con membresía activa
  const publicFile = isPublicKey(fileKey);
  if (isAdminOnlyKey(fileKey)) {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } else if (!publicFile) {
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
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "apto-files",
        Key: fileKey,
        // Forward byte ranges so video players can seek without downloading everything
        Range: request.headers.get("range") ?? undefined,
      })
    );

    if (!object.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Stream straight from R2 instead of buffering the whole object in memory.
    return new NextResponse(object.Body.transformToWebStream(), {
      status: object.ContentRange ? 206 : 200,
      headers: buildHeaders(object, publicFile),
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    if (errorName === "InvalidRange") {
      return new NextResponse(null, { status: 416 });
    }
    if (errorName !== "NoSuchKey" && errorName !== "NotFound") {
      console.error("File proxy error:", fileKey, error);
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
