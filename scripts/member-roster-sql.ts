/**
 * Genera el SQL que carga el padrón de socios (Base de Miembros APTO.xlsx) en
 * la tabla MemberRoster, alinea los números de las cuentas existentes y crea
 * con pago pendiente las cuentas de los socios que aún no tienen una.
 *
 * Uso:
 *   npx tsx scripts/member-roster-sql.ts "<ruta.xlsx>" [--sheet 2025] [--apply] > padron.sql
 *
 * Sin --apply el SQL termina en ROLLBACK (prueba: muestra el resultado sin
 * guardar). El SQL contiene datos personales: no lo guardes en el repo.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { inflateRawSync } from "node:zlib";
import bcrypt from "bcryptjs";
import { buildRoster, rosterToSql, type RosterSourceRow } from "../src/lib/member-roster";

// Same strength as accounts created from the admin panel.
const BCRYPT_ROUNDS = 10;
const TEMP_PASSWORD_BYTES = 16;
const ZIP_END_OF_DIRECTORY = 0x06054b50;
const ZIP_STORED = 0;

/** Minimal reader for the zip container of an .xlsx (no external dependency). */
function readZip(buffer: Buffer): Map<string, string> {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== ZIP_END_OF_DIRECTORY) end--;
  if (end < 0) throw new Error("El archivo no es un .xlsx válido");

  const files = new Map<string, string>();
  let offset = buffer.readUInt32LE(end + 16);
  for (let i = buffer.readUInt16LE(end + 10); i > 0; i--) {
    const method = buffer.readUInt16LE(offset + 10);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const local = buffer.readUInt32LE(offset + 42);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const data = buffer.subarray(start, start + size);
    files.set(name, (method === ZIP_STORED ? data : inflateRawSync(data)).toString("utf8"));
    offset += 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  return files;
}

function decodeXml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

function textRuns(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join("");
}

function columnIndex(cellRef: string): number {
  return [...cellRef.replace(/\d+/g, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

function readSheet(files: Map<string, string>, sheetName?: string): string[][] {
  const workbook = files.get("xl/workbook.xml") ?? "";
  const sheets = [...workbook.matchAll(/<sheet\s[^>]*>/g)].map((m) => attributes(m[0]));
  const sheet = sheetName ? sheets.find((s) => s.name.trim() === sheetName) : sheets[0];
  if (!sheet) throw new Error(`No existe la hoja "${sheetName}"`);

  const rels = files.get("xl/_rels/workbook.xml.rels") ?? "";
  const target = [...rels.matchAll(/<Relationship\s[^>]*>/g)]
    .map((m) => attributes(m[0]))
    .find((rel) => rel.Id === sheet["r:id"])?.Target;
  if (!target) throw new Error(`No se encontró el contenido de la hoja "${sheet.name}"`);
  const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

  const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
    (m) => textRuns(m[1])
  );

  return [...(files.get(path) ?? "").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
    const cells: string[] = [];
    for (const cell of row[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const { r, t } = attributes(cell[1]);
      const raw = cell[2] ?? "";
      const value = raw.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      cells[columnIndex(r)] =
        t === "s" ? shared[Number(value)] ?? "" : t === "inlineStr" ? textRuns(raw) : decodeXml(value);
    }
    return Array.from(cells, (value) => value ?? "");
  });
}

function headerKey(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** Finds the header row by its labels so column order in the sheet does not matter. */
function toSourceRows(rows: string[][]): RosterSourceRow[] {
  const headerAt = rows.findIndex((row) => {
    const keys = row.map(headerKey);
    return keys.includes("membresia") && keys.includes("correo") && keys.includes("nombre");
  });
  if (headerAt < 0) throw new Error('No se encontró el encabezado "Nombre / Membresía / Correo"');

  const keys = rows[headerAt].map(headerKey);
  const [name, number, email] = ["nombre", "membresia", "correo"].map((k) => keys.indexOf(k));
  return rows
    .slice(headerAt + 1)
    .filter((row) => [row[name], row[number], row[email]].some((v) => v?.trim()))
    .map((row) => ({
      name: row[name] ?? "",
      memberNumber: row[number] ?? "",
      email: row[email] ?? "",
    }));
}

function main(): void {
  const args = process.argv.slice(2);
  const sheetFlag = args.indexOf("--sheet");
  const sheetName = sheetFlag >= 0 ? args[sheetFlag + 1] : undefined;
  const file = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--sheet");
  if (!file) {
    console.error('Uso: npx tsx scripts/member-roster-sql.ts "<ruta.xlsx>" [--sheet 2025] [--apply]');
    process.exit(1);
  }

  const rows = toSourceRows(readSheet(readZip(readFileSync(file)), sheetName));
  const roster = buildRoster(rows);
  const commit = args.includes("--apply");

  // Nobody knows these passwords: members set theirs via the reset email.
  const passwordHash = () =>
    bcrypt.hashSync(randomBytes(TEMP_PASSWORD_BYTES).toString("hex"), BCRYPT_ROUNDS);

  process.stdout.write(
    rosterToSql(roster, {
      source: basename(file),
      generatedAt: new Date(),
      commit,
      passwordHash,
    })
  );

  console.error(`${roster.entries.length} números del padrón · modo ${commit ? "APLICAR" : "PRUEBA"}`);
  for (const issue of roster.issues) console.error(`  - ${issue}`);
}

main();
