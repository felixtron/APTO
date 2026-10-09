import { describe, expect, it, vi } from "vitest";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  generateCertificatePdf,
  generateTrainingCertificatePdf,
} from "@/lib/generate-certificate";
import type { CertificateSignatory } from "@/lib/certificate-signatory";

// 1×1 transparent PNG
const PNG_BYTES = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  )
);

const base = {
  memberName: "Ana Pérez",
  memberNumber: "LTO0001",
  certificateId: "APTO-2026-0001",
};

function signatory(withSignature: boolean): CertificateSignatory {
  return {
    name: "T.O. Luz Martínez",
    title: "Presidenta",
    signature: withSignature ? { bytes: PNG_BYTES, format: "png" } : null,
  };
}

async function countPageImages(pdfBytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes);
  const xObjects = doc.getPages()[0].node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
  return xObjects?.keys().length ?? 0;
}

describe("certificate signature", () => {
  it("embeds the autograph signature in membership certificates", async () => {
    const period = { periodStart: new Date(2026, 0, 1), periodEnd: new Date(2026, 11, 31) };
    const unsigned = await generateCertificatePdf({ ...base, ...period, signatory: signatory(false) });
    const signed = await generateCertificatePdf({ ...base, ...period, signatory: signatory(true) });

    expect(await countPageImages(signed.pdfBytes)).toBe(
      (await countPageImages(unsigned.pdfBytes)) + 1
    );
  });

  it("embeds the autograph signature in training certificates", async () => {
    const event = { eventTitle: "Integración Sensorial", eventDate: new Date(2026, 8, 12) };
    const unsigned = await generateTrainingCertificatePdf({ ...base, ...event, signatory: signatory(false) });
    const signed = await generateTrainingCertificatePdf({ ...base, ...event, signatory: signatory(true) });

    expect(await countPageImages(signed.pdfBytes)).toBe(
      (await countPageImages(unsigned.pdfBytes)) + 1
    );
  });
});
