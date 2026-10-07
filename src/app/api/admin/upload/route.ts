import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { uploadFile } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
// Extension is derived from the validated MIME type, never from the file name.
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// Must stay within the public prefixes served by /api/files.
const ALLOWED_FOLDERS = new Set([
  "uploads",
  "noticias",
  "eventos",
  "mesa-directiva",
  "galeria",
  "nosotros",
]);

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderField = formData.get("folder");
  const folder = typeof folderField === "string" && folderField ? folderField : "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Carpeta no permitida" }, { status: 400 });
  }

  const ext = EXTENSION_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "El archivo es demasiado grande. Máximo 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 50);
  const key = `${folder}/${timestamp}-${safeName}.${ext}`;

  const url = await uploadFile(buffer, key, file.type);

  return NextResponse.json({ url, key });
}
