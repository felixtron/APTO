import { describe, expect, it } from "vitest";
import {
  detectSignatureFormat,
  fitSignature,
  isPresidentTitle,
  isSignatureKey,
  pickSignatory,
} from "@/lib/certificate-signature";

describe("isPresidentTitle", () => {
  it("accepts both genders, any case and accents", () => {
    expect(isPresidentTitle("Presidente")).toBe(true);
    expect(isPresidentTitle("Presidenta")).toBe(true);
    expect(isPresidentTitle("  PRESIDENTA ")).toBe(true);
  });

  it("rejects other board roles that contain the word", () => {
    expect(isPresidentTitle("Vicepresidenta")).toBe(false);
    expect(isPresidentTitle("Expresidente")).toBe(false);
    expect(isPresidentTitle("Secretaria")).toBe(false);
  });
});

describe("pickSignatory", () => {
  it("returns the first president in display order", () => {
    const board = [
      { name: "Ana", title: "Vicepresidenta" },
      { name: "Luz", title: "Presidenta" },
      { name: "Eva", title: "Presidente Honorario" },
    ];
    expect(pickSignatory(board)?.name).toBe("Luz");
  });

  it("returns null when nobody holds the presidency", () => {
    expect(pickSignatory([{ title: "Tesorera" }])).toBeNull();
    expect(pickSignatory([])).toBeNull();
  });
});

describe("isSignatureKey", () => {
  it("accepts keys inside the signatures folder", () => {
    expect(isSignatureKey("firmas/1728000000-firma.png")).toBe(true);
  });

  it("rejects other folders, traversal and empty values", () => {
    expect(isSignatureKey("mesa-directiva/foto.png")).toBe(false);
    expect(isSignatureKey("firmas/../constancias/x.pdf")).toBe(false);
    expect(isSignatureKey("firmas/")).toBe(false);
    expect(isSignatureKey("firmas/a.png?v=1")).toBe(false);
    expect(isSignatureKey(null)).toBe(false);
  });
});

describe("detectSignatureFormat", () => {
  it("recognizes PNG and JPEG by their magic bytes", () => {
    expect(detectSignatureFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe("png");
    expect(detectSignatureFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
  });

  it("rejects formats pdf-lib cannot embed", () => {
    const webp = new TextEncoder().encode("RIFF....WEBP");
    expect(detectSignatureFormat(webp)).toBeNull();
    expect(detectSignatureFormat(new Uint8Array())).toBeNull();
  });
});

describe("fitSignature", () => {
  const box = { maxWidth: 150, maxHeight: 50 };

  it("keeps the aspect ratio when height is the limit", () => {
    expect(fitSignature(268, 196, box)).toEqual({ width: 268 * (50 / 196), height: 50 });
  });

  it("keeps the aspect ratio when width is the limit", () => {
    expect(fitSignature(600, 100, box)).toEqual({ width: 150, height: 25 });
  });

  it("enlarges small images up to the box", () => {
    expect(fitSignature(30, 10, box)).toEqual({ width: 150, height: 50 });
  });
});
