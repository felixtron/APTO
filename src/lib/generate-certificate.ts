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

export interface TrainingCertificateData {
  memberName: string;
  memberNumber: string;
  certificateId: string;
  eventTitle: string;
  eventDate: Date;
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

// Cache font and template buffers in memory (they never change at runtime)
let _cachedTemplate: Uint8Array | null = null;
const _fontCache = new Map<string, Uint8Array>();

function loadFont(filename: string): Uint8Array {
  if (!_fontCache.has(filename)) {
    const fontPath = path.join(process.cwd(), "public", "fonts", filename);
    _fontCache.set(filename, fs.readFileSync(fontPath));
  }
  return _fontCache.get(filename)!;
}

function loadTemplate(): Uint8Array {
  if (!_cachedTemplate) {
    const templatePath = path.join(process.cwd(), "PlantillaAPTO.pdf");
    _cachedTemplate = fs.readFileSync(templatePath);
  }
  return _cachedTemplate;
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
  const existing = await prisma.certificate.findFirst({
    where: { memberId, type, year, eventId: null },
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

export async function generateTrainingCertificatePdf(
  data: TrainingCertificateData
): Promise<CertificateResult> {
  const templateBytes = loadTemplate();
  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  const page = doc.getPages()[0];
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const centerX = pageWidth / 2;

  const interRegular = await doc.embedFont(loadFont("Inter-Regular.ttf"));
  const interBold = await doc.embedFont(loadFont("Inter-Bold.ttf"));
  const loraBoldItalic = await doc.embedFont(loadFont("Lora-BoldItalic.ttf"));

  // ── "CONSTANCIA:" ──
  drawCentered(page, "CONSTANCIA:", pageHeight - 150, 30, loraBoldItalic, DARK);

  // ── Member Name ──
  drawCentered(page, data.memberName, pageHeight - 200, 26, interBold, DARK);

  // ── Event participation text ──
  drawCentered(page, "Por su participación en:", pageHeight - 240, 13, interRegular, GRAY);

  // ── Event title ──
  const titleSize = data.eventTitle.length > 50 ? 14 : 16;
  drawCentered(page, data.eventTitle, pageHeight - 260, titleSize, interBold, DARK);

  // ── Event date ──
  const dateStr = `${data.eventDate.getDate()} de ${MONTHS_ES[data.eventDate.getMonth()]} de ${data.eventDate.getFullYear()}`;
  drawCentered(page, dateStr, pageHeight - 280, 12, interRegular, GRAY);

  // ── Signature line ──
  const signY = pageHeight - 330;
  page.drawLine({
    start: { x: centerX - 100, y: signY },
    end: { x: centerX + 100, y: signY },
    thickness: 0.8,
    color: rgb(0.7, 0.7, 0.7),
  });

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

  const pdfBytes = await doc.save();
  const sha256Hash = sha256(pdfBytes);
  return { pdfBytes, sha256Hash };
}

/**
 * Create a training certificate for a member who completed an event (idempotent).
 */
export async function createTrainingCertificate(memberId: string, eventId: string) {
  const year = new Date().getFullYear();
  const type = "training";

  const existing = await prisma.certificate.findFirst({
    where: { memberId, type, year, eventId },
  });

  if (existing) return;

  const count = await prisma.certificate.count({ where: { year } });
  const certificateId = await generateCertificateId(year, count);

  await prisma.certificate.create({
    data: {
      memberId,
      eventId,
      certificateId,
      type,
      year,
      status: "ACTIVE",
      issuedAt: new Date(),
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
