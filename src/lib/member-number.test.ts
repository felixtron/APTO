import { describe, expect, it } from "vitest";
import {
  formatMemberNumber,
  memberNumberSchema,
  memberNumberSequence,
  nextMemberNumberAfter,
  normalizeMemberNumber,
} from "@/lib/member-number";

describe("formatMemberNumber", () => {
  it("pads the sequence to four digits like the roster", () => {
    expect(formatMemberNumber(7)).toBe("LTO0007");
    expect(formatMemberNumber(128)).toBe("LTO0128");
  });

  it("keeps growing past 9999", () => {
    expect(formatMemberNumber(10000)).toBe("LTO10000");
  });
});

describe("memberNumberSequence", () => {
  it("reads the sequence of a canonical number", () => {
    expect(memberNumberSequence("LTO0127")).toBe(127);
  });

  it("ignores legacy random numbers and empty values", () => {
    expect(memberNumberSequence("3120971IC")).toBeNull();
    expect(memberNumberSequence(null)).toBeNull();
  });
});

describe("normalizeMemberNumber", () => {
  it("cleans the padding and casing found in the spreadsheet", () => {
    expect(normalizeMemberNumber("LTO0002   ")).toBe("LTO0002");
    expect(normalizeMemberNumber(" lto 12 ")).toBe("LTO0012");
  });

  it("rejects values that are not roster numbers", () => {
    expect(normalizeMemberNumber("3120971IC")).toBeNull();
    expect(normalizeMemberNumber("LTO0000")).toBeNull();
    expect(normalizeMemberNumber("LTO1234567")).toBeNull();
    expect(normalizeMemberNumber("")).toBeNull();
  });
});

describe("nextMemberNumberAfter", () => {
  it("continues after the highest canonical number", () => {
    expect(nextMemberNumberAfter(["LTO0003", "LTO0127", "LTO0010"])).toBe("LTO0128");
  });

  it("skips legacy numbers when finding the highest", () => {
    expect(nextMemberNumberAfter(["9999999XX", null, "LTO0005"])).toBe("LTO0006");
  });

  it("starts at LTO0001 when nothing is assigned", () => {
    expect(nextMemberNumberAfter([])).toBe("LTO0001");
  });
});

describe("memberNumberSchema", () => {
  it("returns the canonical number", () => {
    expect(memberNumberSchema.parse("lto45")).toBe("LTO0045");
  });

  it("explains the expected format on bad input", () => {
    const result = memberNumberSchema.safeParse("ABC");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Número de socio inválido (formato LTO0000)"
    );
  });
});
