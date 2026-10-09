import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  member: { findMany: vi.fn(), findUnique: vi.fn() },
  memberRoster: { findMany: vi.fn(), findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import {
  createWithMemberNumber,
  findMemberNumberConflict,
  nextMemberNumber,
} from "@/lib/assign-member-number";

const uniqueViolation = Object.assign(new Error("Unique constraint failed"), {
  code: "P2002",
});

describe("nextMemberNumber", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("continues after the highest number across members and roster", async () => {
    db.member.findMany.mockResolvedValue([{ memberNumber: "LTO0130" }]);
    db.memberRoster.findMany.mockResolvedValue([
      { memberNumber: "LTO0001" },
      { memberNumber: "LTO0127" },
    ]);

    expect(await nextMemberNumber()).toBe("LTO0131");
  });
});

describe("createWithMemberNumber", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.member.findMany.mockResolvedValue([]);
    db.memberRoster.findMany.mockResolvedValue([{ memberNumber: "LTO0127" }]);
  });

  it("gives a roster member their reserved number", async () => {
    db.memberRoster.findUnique.mockResolvedValue({ memberNumber: "LTO0045" });
    db.member.findUnique.mockResolvedValue(null);
    const create = vi.fn(async (memberNumber: string) => ({ id: "m1", memberNumber }));

    const result = await createWithMemberNumber("socia@example.com", create);

    expect(create).toHaveBeenCalledWith("LTO0045");
    expect(result.memberNumber).toBe("LTO0045");
  });

  it("gives someone outside the roster the next free number", async () => {
    db.memberRoster.findUnique.mockResolvedValue(null);
    const create = vi.fn(async (memberNumber: string) => memberNumber);

    const result = await createWithMemberNumber("nuevo@example.com", create);

    expect(result).toEqual({ record: "LTO0128", memberNumber: "LTO0128" });
  });

  it("does not reuse a reserved number another member already holds", async () => {
    db.memberRoster.findUnique.mockResolvedValue({ memberNumber: "LTO0045" });
    db.member.findUnique.mockResolvedValue({ id: "someone-else" });
    const create = vi.fn(async (memberNumber: string) => memberNumber);

    const result = await createWithMemberNumber("socia@example.com", create);

    expect(result.memberNumber).toBe("LTO0128");
  });

  it("retries with a fresh number when a concurrent signup takes it", async () => {
    db.memberRoster.findUnique.mockResolvedValue(null);
    db.member.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ memberNumber: "LTO0128" }]);
    const create = vi
      .fn<(memberNumber: string) => Promise<string>>()
      .mockRejectedValueOnce(uniqueViolation)
      .mockImplementation(async (memberNumber) => memberNumber);

    const result = await createWithMemberNumber("nuevo@example.com", create);

    expect(create).toHaveBeenNthCalledWith(1, "LTO0128");
    expect(result.memberNumber).toBe("LTO0129");
  });

  it("gives up after repeated conflicts", async () => {
    db.memberRoster.findUnique.mockResolvedValue(null);
    const create = vi.fn().mockRejectedValue(uniqueViolation);

    await expect(createWithMemberNumber("nuevo@example.com", create)).rejects.toBe(
      uniqueViolation
    );
    expect(create).toHaveBeenCalledTimes(3);
  });

  it("does not retry unrelated errors", async () => {
    db.memberRoster.findUnique.mockResolvedValue(null);
    const failure = new Error("connection lost");
    const create = vi.fn().mockRejectedValue(failure);

    await expect(createWithMemberNumber("nuevo@example.com", create)).rejects.toBe(failure);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("findMemberNumberConflict", () => {
  const owner = { email: "socia@example.com", memberId: "m1" };

  beforeEach(() => {
    vi.resetAllMocks();
    db.member.findMany.mockResolvedValue([]);
    db.memberRoster.findMany.mockResolvedValue([{ memberNumber: "LTO0127" }]);
    db.member.findUnique.mockResolvedValue(null);
    db.memberRoster.findUnique.mockResolvedValue(null);
  });

  it("allows a free roster number with no email on file", async () => {
    db.memberRoster.findUnique.mockResolvedValue({ name: "Sin correo", email: null });

    expect(await findMemberNumberConflict("LTO0029", owner, false)).toBeNull();
  });

  it("allows the member's own reserved number and the one they already hold", async () => {
    db.memberRoster.findUnique.mockResolvedValue({ name: "Socia", email: "socia@example.com" });
    db.member.findUnique.mockResolvedValue({ id: "m1" });

    expect(await findMemberNumberConflict("LTO0045", owner, false)).toBeNull();
  });

  it("rejects a number another member holds, even when overriding", async () => {
    db.member.findUnique.mockResolvedValue({ id: "m2" });

    const conflict = await findMemberNumberConflict("LTO0045", owner, true);

    expect(conflict).toMatchObject({ overridable: false });
    expect(conflict?.message).toContain("ya está asignado");
  });

  it("rejects skipping ahead of the next free number", async () => {
    const conflict = await findMemberNumberConflict("LTO0500", owner, true);

    expect(conflict?.message).toContain("LTO0128");
  });

  it("asks for confirmation when the roster reserves it for another email", async () => {
    db.memberRoster.findUnique.mockResolvedValue({ name: "Otra Persona", email: "otra@example.com" });

    const conflict = await findMemberNumberConflict("LTO0045", owner, false);

    expect(conflict).toEqual({
      message: "El número LTO0045 está reservado en el padrón para Otra Persona",
      overridable: true,
    });
    expect(await findMemberNumberConflict("LTO0045", owner, true)).toBeNull();
  });
});
