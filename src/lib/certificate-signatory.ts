import { prisma } from "@/lib/prisma";
import { downloadFile, getKeyFromUrl } from "@/lib/storage";
import {
  detectSignatureFormat,
  isSignatureKey,
  pickSignatory,
  type SignatureImage,
} from "@/lib/certificate-signature";

/** Firma que aparece al pie de las constancias. */
export interface CertificateSignatory {
  name: string;
  title: string | null;
  signature: SignatureImage | null;
}

// Mientras el admin no registre una presidencia, la constancia firma a nombre de la mesa.
const FALLBACK_SIGNATORY: CertificateSignatory = {
  name: "Mesa Directiva APTO",
  title: null,
  signature: null,
};

/** Una firma enviada por el admin: null la quita; una URL debe apuntar a la carpeta de firmas. */
export function isAcceptedSignatureUrl(value: unknown): value is string | null {
  if (value === null) return true;
  return typeof value === "string" && isSignatureKey(getKeyFromUrl(value));
}

async function loadSignature(url: string | null): Promise<SignatureImage | null> {
  if (!url) return null;

  const key = getKeyFromUrl(url);
  if (!isSignatureKey(key)) {
    throw new Error(`Signature URL outside the signatures folder: ${url}`);
  }

  const bytes = await downloadFile(key);
  const format = detectSignatureFormat(bytes);
  if (!format) {
    throw new Error(`Signature is not a PNG or JPG: ${key}`);
  }
  return { bytes, format };
}

/**
 * La presidencia en curso firma las constancias. Lanza si tiene una firma
 * registrada que no se puede leer: mejor no emitir que emitir sin firma.
 */
export async function loadCertificateSignatory(): Promise<CertificateSignatory> {
  const board = await prisma.boardMember.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    select: { name: true, title: true, signatureUrl: true },
  });

  const president = pickSignatory(board);
  if (!president) return FALLBACK_SIGNATORY;

  return {
    name: president.name,
    title: president.title,
    signature: await loadSignature(president.signatureUrl),
  };
}
