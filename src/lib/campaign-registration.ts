import { z } from "zod";
import { emailSchema } from "@/lib/validation";

export const registrationSchema = z.object({
  name: z
    .string({ error: "Escribe tu nombre" })
    .trim()
    .min(2, "Escribe tu nombre")
    .max(120, "El nombre es demasiado largo"),
  email: emailSchema,
  acceptsEmails: z.boolean().default(true),
  /** Honeypot: las personas no lo ven; los bots lo llenan. */
  website: z.string().max(200).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export interface RegistrationRow {
  name: string;
  email: string;
  acceptsEmails: boolean;
  createdAt: Date;
}

const CSV_BOM = "﻿";
const CSV_HEADERS = ["Nombre", "Correo", "Acepta recibir correos", "Fecha de registro"];

function escapeCsvCell(value: string): string {
  // Evita que Excel ejecute fórmulas en celdas que empiezan con = + - @
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Mexico_City",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function registrationsToCsv(rows: readonly RegistrationRow[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.email,
        row.acceptsEmails ? "Sí" : "No",
        formatDate(row.createdAt),
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ];
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}
