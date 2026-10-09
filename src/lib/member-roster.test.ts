import { describe, expect, it } from "vitest";
import { buildRoster, rosterToSql, type RosterSourceRow } from "@/lib/member-roster";

function row(memberNumber: string, name: string, email: string): RosterSourceRow {
  return { memberNumber, name, email };
}

describe("buildRoster", () => {
  it("cleans numbers, names and emails typed in the spreadsheet", () => {
    const roster = buildRoster([
      row("LTO0002   ", "Ana  Pérez Soto   ", " Ana.Perez@Example.com "),
    ]);

    expect(roster.entries).toEqual([
      {
        memberNumber: "LTO0002",
        name: "Ana Pérez Soto",
        email: "ana.perez@example.com",
        note: null,
      },
    ]);
    expect(roster.issues).toEqual([]);
  });

  it("keeps rows without a usable email so their number stays reserved", () => {
    const roster = buildRoster([row("LTO0029", "LUIS RUIZ", "Not Found")]);

    expect(roster.entries[0]).toMatchObject({ memberNumber: "LTO0029", email: null });
    expect(roster.entries[0].note).toBe("Sin correo válido en el padrón");
    expect(roster.issues).toHaveLength(1);
  });

  it("keeps the lowest number when the same person is listed twice", () => {
    const roster = buildRoster([
      row("LTO0119", "Marta Gil Ortega", "marta@example.com"),
      row("LTO0100", "Marta Gil Ortega ", "marta@example.com"),
    ]);

    expect(roster.entries.map((e) => [e.memberNumber, e.email])).toEqual([
      ["LTO0100", "marta@example.com"],
      ["LTO0119", null],
    ]);
    expect(roster.entries[1].note).toContain("LTO0100");
    expect(roster.heldEmails).toEqual([]);
  });

  it("matches the same person regardless of accents and case", () => {
    const roster = buildRoster([
      row("LTO0001", "José Pérez", "jp@example.com"),
      row("LTO0002", "JOSE PEREZ", "jp@example.com"),
    ]);

    expect(roster.heldEmails).toEqual([]);
    expect(roster.entries[0].email).toBe("jp@example.com");
  });

  it("holds back an email shared by different people", () => {
    const roster = buildRoster([
      row("LTO0010", "Rosa Díaz", "familia@example.com"),
      row("LTO0066", "Elena Mora", "familia@example.com"),
    ]);

    expect(roster.entries.every((entry) => entry.email === null)).toBe(true);
    expect(roster.heldEmails).toEqual(["familia@example.com"]);
    expect(roster.issues[0]).toContain("asignar a mano");
  });

  it("skips rows with an invalid or repeated number", () => {
    const roster = buildRoster([
      row("LTO0001", "Ana", "ana@example.com"),
      row("LTO0001", "Otra Ana", "otra@example.com"),
      row("12345", "Sin número", "sin@example.com"),
    ]);

    expect(roster.entries.map((entry) => entry.memberNumber)).toEqual(["LTO0001"]);
    expect(roster.issues).toHaveLength(2);
  });
});

describe("rosterToSql", () => {
  const options = {
    source: "Base.xlsx",
    generatedAt: new Date("2026-10-08T00:00:00Z"),
    passwordHash: (entry: { memberNumber: string }) => `hash-${entry.memberNumber}`,
  };

  it("escapes quotes in names", () => {
    const roster = buildRoster([row("LTO0001", "Ana O'Neil", "ana@example.com")]);

    expect(rosterToSql(roster, { ...options, commit: true })).toContain("'Ana O''Neil'");
  });

  it("rolls back on a dry run and commits otherwise", () => {
    const roster = buildRoster([row("LTO0001", "Ana", "ana@example.com")]);

    expect(rosterToSql(roster, { ...options, commit: false }).trimEnd()).toMatch(/ROLLBACK;$/);
    expect(rosterToSql(roster, { ...options, commit: true }).trimEnd()).toMatch(/COMMIT;$/);
  });

  it("leaves accounts with a held email out of the automatic renumbering", () => {
    const roster = buildRoster([
      row("LTO0010", "Rosa Díaz", "familia@example.com"),
      row("LTO0066", "Elena Mora", "familia@example.com"),
    ]);

    expect(rosterToSql(roster, { ...options, commit: true })).toContain(
      `AND lower("email") NOT IN ('familia@example.com')`
    );
  });

  it("omits the held-email filter when there is none", () => {
    const roster = buildRoster([row("LTO0001", "Ana", "ana@example.com")]);

    expect(rosterToSql(roster, { ...options, commit: true })).not.toContain("NOT IN");
  });

  it("creates pending accounts only for roster rows with a usable email", () => {
    const roster = buildRoster([
      row("LTO0001", "Ana", "ana@example.com"),
      row("LTO0002", "Sin Correo", "Not Found"),
    ]);

    const sql = rosterToSql(roster, { ...options, commit: true });

    expect(sql).toContain("('LTO0001', 'hash-LTO0001')");
    expect(sql).not.toContain("hash-LTO0002");
    expect(sql).toContain(`'PENDING'::"MemberStatus"`);
  });

  it("skips account creation when no row has an email", () => {
    const roster = buildRoster([row("LTO0002", "Sin Correo", "Not Found")]);

    expect(rosterToSql(roster, { ...options, commit: true })).not.toContain(
      'INSERT INTO "Member"'
    );
  });
});
