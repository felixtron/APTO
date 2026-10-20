import { describe, expect, it } from "vitest";
import { registrationSchema, registrationsToCsv } from "@/lib/campaign-registration";

describe("registrationSchema", () => {
  it("accepts a valid registration and defaults acceptsEmails to true", () => {
    const result = registrationSchema.safeParse({ name: "  Ana López ", email: " ANA@Correo.com " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ana López");
      expect(result.data.email).toBe("ana@correo.com");
      expect(result.data.acceptsEmails).toBe(true);
    }
  });

  it("keeps an explicit opt-out", () => {
    const result = registrationSchema.safeParse({ name: "Ana", email: "a@b.mx", acceptsEmails: false });
    expect(result.success && result.data.acceptsEmails).toBe(false);
  });

  it("rejects short names and invalid emails", () => {
    expect(registrationSchema.safeParse({ name: "A", email: "a@b.mx" }).success).toBe(false);
    expect(registrationSchema.safeParse({ name: "Ana", email: "no-es-correo" }).success).toBe(false);
    expect(registrationSchema.safeParse({ email: "a@b.mx" }).success).toBe(false);
  });
});

describe("registrationsToCsv", () => {
  const date = new Date("2026-10-27T18:30:00Z");

  it("starts with BOM and Spanish headers, one row per registration", () => {
    const csv = registrationsToCsv([{ name: "Ana", email: "a@b.mx", acceptsEmails: true, createdAt: date }]);
    expect(csv.startsWith("﻿Nombre,Correo,Acepta recibir correos,Fecha de registro\r\n")).toBe(true);
    expect(csv).toContain("Ana,a@b.mx,Sí,2026-10-27 12:30");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("escapes commas, quotes and line breaks", () => {
    const csv = registrationsToCsv([{ name: 'Pérez, "Ana"\nLuz', email: "a@b.mx", acceptsEmails: false, createdAt: date }]);
    expect(csv).toContain('"Pérez, ""Ana""\nLuz",a@b.mx,No');
  });

  it("neutralizes spreadsheet formulas", () => {
    const csv = registrationsToCsv([{ name: "=HYPERLINK(\"x\")", email: "a@b.mx", acceptsEmails: true, createdAt: date }]);
    expect(csv).toContain("\"'=HYPERLINK(\"\"x\"\")\"");
  });

  it("returns only headers for no rows", () => {
    expect(registrationsToCsv([])).toBe("﻿Nombre,Correo,Acepta recibir correos,Fecha de registro\r\n");
  });
});
