/**
 * Firma autógrafa de las constancias: quién firma y cómo se coloca la imagen.
 * Solo funciones puras (también las usa el panel de admin en el navegador);
 * la carga desde la BD y R2 vive en certificate-signatory.ts.
 */

export const SIGNATURE_FOLDER = "firmas";

export type SignatureFormat = "png" | "jpg";

export interface SignatureImage {
  bytes: Uint8Array;
  format: SignatureFormat;
}

export interface SignatureBox {
  maxWidth: number;
  maxHeight: number;
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function normalizeTitle(title: string): string {
  return title.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** "Presidente" o "Presidenta"; no "Vicepresidenta" ni "Expresidente". */
export function isPresidentTitle(title: string): boolean {
  return normalizeTitle(title).startsWith("presiden");
}

/**
 * Quién firma las constancias: la presidencia en curso. Recibe la mesa
 * directiva activa ya ordenada por displayOrder.
 */
export function pickSignatory<T extends { title: string }>(boardMembers: readonly T[]): T | null {
  return boardMembers.find((member) => isPresidentTitle(member.title)) ?? null;
}

/** La firma solo puede leerse de su carpeta privada en R2. */
export function isSignatureKey(key: string | null): key is string {
  if (!key?.startsWith(`${SIGNATURE_FOLDER}/`) || /[?#]/.test(key)) return false;
  return key.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

/** pdf-lib solo incrusta PNG y JPG; se decide por el contenido, no por la extensión. */
export function detectSignatureFormat(bytes: Uint8Array): SignatureFormat | null {
  const startsWith = (magic: number[]) => magic.every((byte, i) => bytes[i] === byte);
  if (startsWith(PNG_MAGIC)) return "png";
  if (startsWith(JPEG_MAGIC)) return "jpg";
  return null;
}

/** Escala la firma para llenar la caja sin deformarla. */
export function fitSignature(
  width: number,
  height: number,
  box: SignatureBox
): { width: number; height: number } {
  const scale = Math.min(box.maxWidth / width, box.maxHeight / height);
  return { width: width * scale, height: height * scale };
}
