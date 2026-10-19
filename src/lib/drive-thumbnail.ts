/**
 * Miniaturas de Google Drive. Funciona para archivos compartidos como
 * "cualquier persona con el enlace"; si Drive responde 403 la tarjeta
 * muestra su fallback.
 */
const DRIVE_HOST = /(^|\.)drive\.google\.com$/i;
const FILE_PATH = /\/file\/d\/([\w-]+)/;

export const DEFAULT_THUMBNAIL_WIDTH = 800;

export function getDriveFileId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!DRIVE_HOST.test(parsed.hostname)) return null;

  const fromPath = parsed.pathname.match(FILE_PATH);
  if (fromPath) return fromPath[1];

  const fromQuery = parsed.searchParams.get("id");
  return fromQuery && /^[\w-]+$/.test(fromQuery) ? fromQuery : null;
}

export function getDriveThumbnailUrl(
  url: string,
  width: number = DEFAULT_THUMBNAIL_WIDTH
): string | null {
  const id = getDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}
