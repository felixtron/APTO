import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface CertificateData {
  memberName: string;
  memberNumber: string;
  certificateId: string; // Folio: "APTO-2025-0001"
  periodStart: Date;
  periodEnd: Date;
  presidentName: string;
}

export interface CertificateResult {
  pdfBytes: Uint8Array;
  sha256Hash: string;
}

const DARK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.35, 0.35, 0.35);

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPeriod(start: Date, end: Date): string {
  const startStr = `${MONTHS_ES[start.getMonth()]} ${start.getFullYear()}`;
  const endStr = `${MONTHS_ES[end.getMonth()]} ${end.getFullYear()}`;
  return `${startStr} a ${endStr}`;
}

function loadFont(filename: string): Uint8Array {
  const fontPath = path.join(process.cwd(), "public", "fonts", filename);
  return fs.readFileSync(fontPath);
}

function loadTemplate(): Uint8Array {
  const templatePath = path.join(process.cwd(), "PlantillaAPTO.pdf");
  return fs.readFileSync(templatePath);
}

function buildVerificationUrl(certificateId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
  return `${baseUrl}/verificar/${certificateId}`;
}

/** Generate next sequential folio for a given year */
export async function generateCertificateId(
  year: number,
  currentCount: number
): Promise<string> {
  const seq = (currentCount + 1).toString().padStart(4, "0");
  return `APTO-${year}-${seq}`;
}

/** Calculate SHA-256 hash of PDF bytes */
function sha256(data: Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<CertificateResult> {
  // Load the template PDF as base
  const templateBytes = loadTemplate();
  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  const page = doc.getPages()[0];
  const pageWidth = page.getWidth();   // 720
  const pageHeight = page.getHeight(); // 405.12
  const centerX = pageWidth / 2;

  // ── Fonts ──
  const interRegular = await doc.embedFont(loadFont("Inter-Regular.ttf"));
  const interBold = await doc.embedFont(loadFont("Inter-Bold.ttf"));
  const loraBoldItalic = await doc.embedFont(loadFont("Lora-BoldItalic.ttf"));

  // ── "CONSTANCIA:" — centered, below "Otorga la presente" ──
  drawCentered(page, "CONSTANCIA:", pageHeight - 150, 30, loraBoldItalic, DARK);

  // ── Member Name — centered, prominent ──
  drawCentered(page, data.memberName, pageHeight - 200, 26, interBold, DARK);

  // ── Period — below "Como Miembro Activo..." (template text) ──
  const periodText = `Por el periodo: ${formatPeriod(data.periodStart, data.periodEnd)}`;
  drawCentered(page, periodText, pageHeight - 270, 13, interRegular, GRAY);

  // ── Signature line ──
  const signY = pageHeight - 330;
  page.drawLine({
    start: { x: centerX - 100, y: signY },
    end: { x: centerX + 100, y: signY },
    thickness: 0.8,
    color: rgb(0.7, 0.7, 0.7),
  });

  // ── President name + label ──
  drawCentered(page, data.presidentName, signY - 16, 11, interBold, DARK);
  drawCentered(page, "Presidente", signY - 30, 10, interRegular, GRAY);

  // ── QR Code (bottom-left) ──
  const margin = 20;
  const verificationUrl = buildVerificationUrl(data.certificateId);
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#2E6DA4", light: "#FFFFFF" },
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrImageBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));
    const qrImage = await doc.embedPng(qrImageBytes);
    const qrSize = 60;
    page.drawImage(qrImage, {
      x: margin + 10,
      y: margin + 8,
      width: qrSize,
      height: qrSize,
    });

    // "Verificar en línea" below QR
    const verifyLabel = "Verificar en línea";
    const verifyWidth = interRegular.widthOfTextAtSize(verifyLabel, 6);
    page.drawText(verifyLabel, {
      x: margin + 10 + qrSize / 2 - verifyWidth / 2,
      y: margin + 2,
      size: 6,
      font: interRegular,
      color: GRAY,
    });
  } catch {
    // QR generation failed — continue without it
  }

  // ── Folio (bottom-center) ──
  const folioText = `Folio: ${data.certificateId}`;
  const folioWidth = interRegular.widthOfTextAtSize(folioText, 8);
  page.drawText(folioText, {
    x: centerX - folioWidth / 2,
    y: margin + 14,
    size: 8,
    font: interRegular,
    color: GRAY,
  });

  // ── Verification URL (tiny, below folio) ──
  const urlText = verificationUrl;
  const urlWidth = interRegular.widthOfTextAtSize(urlText, 6);
  page.drawText(urlText, {
    x: centerX - urlWidth / 2,
    y: margin + 4,
    size: 6,
    font: interRegular,
    color: rgb(0.55, 0.55, 0.55),
  });

  // ── Número de socio (bottom-right) ──
  const socioText = `No. de socio: ${data.memberNumber}`;
  const socioWidth = interRegular.widthOfTextAtSize(socioText, 9);
  page.drawText(socioText, {
    x: pageWidth - margin - 10 - socioWidth,
    y: margin + 18,
    size: 9,
    font: interRegular,
    color: DARK,
  });

  // ── Generate PDF bytes and hash ──
  const pdfBytes = await doc.save();
  const sha256Hash = sha256(pdfBytes);

  return { pdfBytes, sha256Hash };
}

/**
 * Create a membership certificate for a member (idempotent — skips if already exists for this year).
 * Used by both Stripe webhook and admin member creation.
 */
export async function createMembershipCertificate(memberId: string) {
  const year = new Date().getFullYear();
  const type = "membership";

  // Check if certificate already exists for this member/type/year
  const existing = await prisma.certificate.findUnique({
    where: { memberId_type_year: { memberId, type, year } },
  });

  if (existing) return; // Already has a certificate for this period

  // Generate sequential folio
  const count = await prisma.certificate.count({
    where: { year },
  });
  const certificateId = await generateCertificateId(year, count);

  // Expiry = end of membership year
  const expiresAt = new Date(year, 11, 31, 23, 59, 59); // Dec 31

  await prisma.certificate.create({
    data: {
      memberId,
      certificateId,
      type,
      year,
      status: "ACTIVE",
      issuedAt: new Date(),
      expiresAt,
    },
  });
}

// Helper to draw centered text
function drawCentered(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  size: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color: ReturnType<typeof rgb>
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: page.getWidth() / 2 - width / 2,
    y,
    size,
    font,
    color,
  });
}
