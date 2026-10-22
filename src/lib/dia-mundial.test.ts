import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DIA_MUNDIAL,
  FORCE_STATUS_ENV,
  getCountdownParts,
  getEventClosesAt,
  getEventOpensAt,
  getEventWindowStatus,
  toLocalIsoDate,
} from "@/lib/dia-mundial";

const window = { startsOn: "2026-10-27", endsOn: "2026-10-31" };

describe("toLocalIsoDate", () => {
  it("formats the Mexico City calendar date", () => {
    // 04:00Z = 22:00 del día anterior en CDMX (UTC-6, sin horario de verano)
    expect(toLocalIsoDate(new Date("2026-10-27T04:00:00Z"))).toBe("2026-10-26");
    expect(toLocalIsoDate(new Date("2026-10-27T06:00:00Z"))).toBe("2026-10-27");
  });
});

describe("getEventWindowStatus", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is upcoming before the start date", () => {
    expect(getEventWindowStatus(new Date("2026-10-19T15:00:00Z"), window, undefined)).toBe("upcoming");
  });

  it("is still upcoming late on the 26th in Mexico City even if it is the 27th in UTC", () => {
    expect(getEventWindowStatus(new Date("2026-10-27T04:00:00Z"), window, undefined)).toBe("upcoming");
  });

  it("opens on the first day and stays open through the last day", () => {
    expect(getEventWindowStatus(new Date("2026-10-27T06:00:00Z"), window, undefined)).toBe("open");
    expect(getEventWindowStatus(new Date("2026-10-29T18:00:00Z"), window, undefined)).toBe("open");
    // 04:30Z del 1 nov = 22:30 del 31 oct en CDMX
    expect(getEventWindowStatus(new Date("2026-11-01T04:30:00Z"), window, undefined)).toBe("open");
  });

  it("closes the day after the end date", () => {
    expect(getEventWindowStatus(new Date("2026-11-01T06:00:00Z"), window, undefined)).toBe("closed");
    expect(getEventWindowStatus(new Date("2027-01-01T12:00:00Z"), window, undefined)).toBe("closed");
  });

  it("honours a forced status and ignores unknown values", () => {
    const beforeStart = new Date("2026-01-01T12:00:00Z");
    expect(getEventWindowStatus(beforeStart, window, "open")).toBe("open");
    expect(getEventWindowStatus(beforeStart, window, " CLOSED ")).toBe("closed");
    expect(getEventWindowStatus(beforeStart, window, "banana")).toBe("upcoming");
  });

  it("reads the forced status from the environment by default", () => {
    vi.stubEnv(FORCE_STATUS_ENV, "closed");
    expect(getEventWindowStatus(new Date("2026-10-28T18:00:00Z"), window)).toBe("closed");
  });

  it("uses the campaign config by default", () => {
    expect(getEventWindowStatus(new Date("2026-10-28T18:00:00Z"), undefined, undefined)).toBe("open");
    expect(DIA_MUNDIAL.startsOn < DIA_MUNDIAL.endsOn).toBe(true);
  });

  it("rejects malformed dates", () => {
    expect(() =>
      getEventWindowStatus(new Date(), { startsOn: "27/10/2026", endsOn: "2026-10-31" }, undefined)
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe("countdown", () => {
  it("opens at midnight Mexico City on the first day and closes at the end of the last", () => {
    expect(getEventOpensAt(window).toISOString()).toBe("2026-10-27T06:00:00.000Z");
    expect(getEventClosesAt(window).toISOString()).toBe("2026-11-01T05:59:59.000Z");
  });

  it("splits the remaining time into days, hours, minutes and seconds", () => {
    const now = new Date("2026-10-22T04:00:00Z");
    expect(getCountdownParts(now, getEventOpensAt(window))).toEqual({
      days: 5,
      hours: 2,
      minutes: 0,
      seconds: 0,
      done: false,
    });
    expect(
      getCountdownParts(new Date("2026-10-27T05:58:58Z"), getEventOpensAt(window))
    ).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 2, done: false });
  });

  it("clamps at zero once the target has passed", () => {
    expect(getCountdownParts(new Date("2026-10-28T00:00:00Z"), getEventOpensAt(window))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: true,
    });
  });
});
