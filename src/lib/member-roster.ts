import { memberNumberSequence, normalizeMemberNumber } from "@/lib/member-number";

/** One row of the association's spreadsheet, as typed by hand. */
export interface RosterSourceRow {
  memberNumber: string;
  name: string;
  email: string;
}

export interface RosterEntry {
  memberNumber: string;
  name: string;
  /** Null when the spreadsheet has no usable, unambiguous email for the row. */
  email: string | null;
  note: string | null;
}

export interface Roster {
  entries: RosterEntry[];
  /** Emails shared by different people: their accounts need a number assigned by hand. */
  heldEmails: string[];
  issues: string[];
}

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const CANONICAL_NUMBER_SQL = "^LTO[0-9]+$";
const SEQUENCE_DIGITS = 4;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanEmail(value: string): string | null {
  const email = value.trim().toLowerCase().replace(/^<|>$/g, "");
  return EMAIL_PATTERN.test(email) ? email : null;
}

/** Ignores case, accents and spacing, to spot the same person listed twice. */
function nameKey(name: string): string {
  return cleanText(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function bySequence(a: RosterEntry, b: RosterEntry): number {
  return (memberNumberSequence(a.memberNumber) ?? 0) - (memberNumberSequence(b.memberNumber) ?? 0);
}

function parseRows(rows: readonly RosterSourceRow[]): {
  entries: RosterEntry[];
  issues: string[];
} {
  const entries: RosterEntry[] = [];
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = cleanText(row.name);
    const memberNumber = normalizeMemberNumber(row.memberNumber);
    if (!memberNumber) {
      issues.push(`Fila omitida, número inválido "${row.memberNumber.trim()}" (${name})`);
      continue;
    }
    if (seen.has(memberNumber)) {
      issues.push(`Fila omitida, ${memberNumber} repetido (${name})`);
      continue;
    }
    seen.add(memberNumber);

    const email = cleanEmail(row.email);
    if (!email) issues.push(`${memberNumber} ${name}: sin correo válido ("${row.email.trim()}")`);
    entries.push({
      memberNumber,
      name,
      email,
      note: email ? null : "Sin correo válido en el padrón",
    });
  }
  return { entries, issues };
}

/**
 * Cleans the spreadsheet rows into roster entries. Each email maps to at most
 * one number: the same person listed twice keeps the lowest number, and an
 * email shared by different people is held back for manual assignment.
 */
export function buildRoster(rows: readonly RosterSourceRow[]): Roster {
  const parsed = parseRows(rows);
  const issues = [...parsed.issues];
  const heldEmails: string[] = [];
  const resolved = new Map<string, RosterEntry>();

  const byEmail = new Map<string, RosterEntry[]>();
  for (const entry of parsed.entries) {
    if (!entry.email) continue;
    byEmail.set(entry.email, [...(byEmail.get(entry.email) ?? []), entry]);
  }

  for (const [email, group] of byEmail) {
    if (group.length < 2) continue;
    const [first, ...rest] = [...group].sort(bySequence);
    const numbers = group.map((entry) => entry.memberNumber).sort().join(", ");

    if (rest.every((entry) => nameKey(entry.name) === nameKey(first.name))) {
      issues.push(`${email} aparece en ${numbers} (misma persona): se conserva ${first.memberNumber}`);
      for (const entry of rest) {
        resolved.set(entry.memberNumber, {
          ...entry,
          email: null,
          note: `Registro duplicado de ${first.memberNumber} (${email})`,
        });
      }
      continue;
    }

    heldEmails.push(email);
    issues.push(`${email} lo comparten personas distintas (${numbers}): asignar a mano`);
    for (const entry of group) {
      resolved.set(entry.memberNumber, {
        ...entry,
        email: null,
        note: `Correo compartido por ${numbers}: ${email}`,
      });
    }
  }

  const entries = parsed.entries
    .map((entry) => resolved.get(entry.memberNumber) ?? entry)
    .sort(bySequence);
  return { entries, heldEmails: heldEmails.sort(), issues };
}

function sqlString(value: string | null): string {
  return value === null ? "NULL" : `'${value.replace(/'/g, "''")}'`;
}

function sqlComment(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

export interface RosterSqlOptions {
  source: string;
  generatedAt: Date;
  /** false ends the transaction with ROLLBACK, for a dry run. */
  commit: boolean;
  /** Hash of a throwaway password for each account created from the roster. */
  passwordHash: (entry: RosterEntry) => string;
}

const ROSTER_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "MemberRoster" (
    "memberNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemberRoster_pkey" PRIMARY KEY ("memberNumber")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MemberRoster_email_key" ON "MemberRoster"("email");`;

function sqlValues(rows: readonly (string | null)[][], suffix = ""): string {
  return rows.map((row) => `  (${row.map(sqlString).join(", ")}${suffix})`).join(",\n");
}

function loadRosterSql(entries: readonly RosterEntry[]): string {
  const rows = entries.map((e) => [e.memberNumber, e.name, e.email, e.note]);
  return `DELETE FROM "MemberRoster";
INSERT INTO "MemberRoster" ("memberNumber", "name", "email", "note", "updatedAt") VALUES
${sqlValues(rows, ", now()")};`;
}

function alignExistingSql(heldEmails: readonly string[]): string {
  const heldFilter = heldEmails.length
    ? `\n    AND lower("email") NOT IN (${heldEmails.map(sqlString).join(", ")})`
    : "";
  return `-- 1. Socios del padrón que ya tienen cuenta: su número del padrón
UPDATE "Member" AS m
SET "memberNumber" = r."memberNumber", "updatedAt" = now()
FROM "MemberRoster" AS r
WHERE r."email" = lower(m."email")
  AND m."memberNumber" IS DISTINCT FROM r."memberNumber";

-- 2. Cuentas fuera del padrón: siguiente número libre, por fecha de registro
WITH last_number AS (
  SELECT COALESCE(MAX(SUBSTRING(n FROM 4)::int), 0) AS seq
  FROM (
    SELECT "memberNumber" AS n FROM "MemberRoster"
    UNION ALL
    SELECT "memberNumber" FROM "Member" WHERE "memberNumber" ~ '${CANONICAL_NUMBER_SQL}'
  ) AS numbers
),
pending AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS position
  FROM "Member"
  WHERE ("memberNumber" IS NULL OR "memberNumber" !~ '${CANONICAL_NUMBER_SQL}')${heldFilter}
),
numbered AS (
  SELECT pending."id", (last_number.seq + pending.position)::text AS seq
  FROM pending, last_number
)
UPDATE "Member" AS m
SET "memberNumber" = 'LTO' || LPAD(numbered.seq, GREATEST(${SEQUENCE_DIGITS}, LENGTH(numbered.seq)), '0'),
    "updatedAt" = now()
FROM numbered
WHERE m."id" = numbered."id";`;
}

function createAccountsSql(
  entries: readonly RosterEntry[],
  passwordHash: RosterSqlOptions["passwordHash"]
): string {
  const rows = entries
    .filter((entry) => entry.email)
    .map((entry) => [entry.memberNumber, passwordHash(entry)]);
  if (!rows.length) return "-- 3. Sin socios con correo: no se crean cuentas";

  return `-- 3. Socios del padrón sin cuenta: se crean con pago pendiente
INSERT INTO "Member" ("id", "email", "passwordHash", "name", "memberNumber", "type", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, r."email", a."passwordHash", r."name", r."memberNumber",
       'PROFESSIONAL'::"MemberType", 'PENDING'::"MemberStatus", now(), now()
FROM (VALUES
${sqlValues(rows)}
) AS a ("memberNumber", "passwordHash")
JOIN "MemberRoster" AS r ON r."memberNumber" = a."memberNumber"
WHERE NOT EXISTS (
  SELECT 1 FROM "Member" AS m
  WHERE lower(m."email") = r."email" OR m."memberNumber" = r."memberNumber"
);`;
}

const REPORT_SQL = `-- 4. Resumen
SELECT concepto, total FROM (
  SELECT 1 AS orden, 'Cuentas creadas con pago pendiente' AS concepto, count(*) AS total
  FROM "Member" AS m
  WHERE NOT EXISTS (SELECT 1 FROM member_number_before AS b WHERE b."id" = m."id")
  UNION ALL
  SELECT 2, 'Cuentas que ya existían, con número del padrón', count(*)
  FROM "Member" AS m
  JOIN member_number_before AS b ON b."id" = m."id"
  JOIN "MemberRoster" AS r ON r."memberNumber" = m."memberNumber"
  UNION ALL
  SELECT 3, 'Cuentas que ya existían, fuera del padrón', count(*)
  FROM "Member" AS m
  JOIN member_number_before AS b ON b."id" = m."id"
  WHERE m."memberNumber" ~ '${CANONICAL_NUMBER_SQL}'
    AND NOT EXISTS (SELECT 1 FROM "MemberRoster" AS r WHERE r."memberNumber" = m."memberNumber")
  UNION ALL
  SELECT 4, 'Cuentas por revisar a mano', count(*)
  FROM "Member" AS m
  WHERE m."memberNumber" IS NULL OR m."memberNumber" !~ '${CANONICAL_NUMBER_SQL}'
  UNION ALL
  SELECT 5, 'Números del padrón sin cuenta', count(*)
  FROM "MemberRoster" AS r
  WHERE NOT EXISTS (SELECT 1 FROM "Member" AS m WHERE m."memberNumber" = r."memberNumber")
) AS resumen
ORDER BY orden;

-- 5. Cuentas que ya existían: número anterior → nuevo
SELECT m."memberNumber" AS numero,
       b."memberNumber" AS anterior,
       m."email",
       m."name",
       m."status",
       CASE
         WHEN r."memberNumber" IS NOT NULL THEN 'padrón'
         WHEN m."memberNumber" ~ '${CANONICAL_NUMBER_SQL}' THEN 'nuevo'
         ELSE 'REVISAR: asignar a mano'
       END AS origen
FROM "Member" AS m
JOIN member_number_before AS b ON b."id" = m."id"
LEFT JOIN "MemberRoster" AS r ON r."memberNumber" = m."memberNumber"
ORDER BY m."memberNumber";

-- 6. Números del padrón que se quedan sin cuenta
SELECT r."memberNumber" AS numero, r."name", r."note" AS motivo
FROM "MemberRoster" AS r
WHERE NOT EXISTS (SELECT 1 FROM "Member" AS m WHERE m."memberNumber" = r."memberNumber")
ORDER BY r."memberNumber";`;

/**
 * SQL that, in one transaction, loads the roster, gives existing accounts
 * their roster number (or the next free one), creates a pending-payment
 * account for every roster member with a usable email, and reports the result.
 */
export function rosterToSql(roster: Roster, options: RosterSqlOptions): string {
  return `-- Padrón de socios APTO → portal (${roster.entries.length} números)
-- Fuente: ${sqlComment(options.source)}
-- Generado: ${options.generatedAt.toISOString()}
-- Modo: ${options.commit ? "APLICAR (COMMIT)" : "PRUEBA (ROLLBACK, no guarda nada)"}
BEGIN;

${ROSTER_TABLE_SQL}

CREATE TEMP TABLE member_number_before ON COMMIT DROP AS
  SELECT "id", "memberNumber" FROM "Member";

${loadRosterSql(roster.entries)}

${alignExistingSql(roster.heldEmails)}

${createAccountsSql(roster.entries, options.passwordHash)}

${REPORT_SQL}

${options.commit ? "COMMIT" : "ROLLBACK"};
`;
}
