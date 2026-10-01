import { describe, expect, it } from "vitest";

import { addDays, eachDay, endOfMonth, formatDayLabel, formatRange, isIsoDate, todayInChicago } from "./dates";

describe("todayInChicago", () => {
  it("is still the previous day late in the evening Central (CDT, UTC-5)", () => {
    expect(todayInChicago(new Date("2026-10-01T04:30:00Z"))).toBe("2026-09-30");
  });
  it("rolls over at Central midnight", () => {
    expect(todayInChicago(new Date("2026-10-01T05:30:00Z"))).toBe("2026-10-01");
  });
  it("handles standard time (CST, UTC-6)", () => {
    expect(todayInChicago(new Date("2026-12-01T05:30:00Z"))).toBe("2026-11-30");
  });
});

describe("addDays", () => {
  it("crosses month boundaries both ways", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
  });
});

describe("endOfMonth", () => {
  it("returns the last day of the month", () => {
    expect(endOfMonth("2026-10-01")).toBe("2026-10-31");
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });
});

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2026-10-01")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("nope")).toBe(false);
  });
});

describe("formatting", () => {
  it("formats a day label", () => {
    expect(formatDayLabel("2026-10-01")).toBe("Thu, Oct 1");
  });
  it("formats a range", () => {
    expect(formatRange("2026-10-01", "2026-10-31")).toBe("Oct 1 – Oct 31");
  });
});

describe("eachDay", () => {
  it("lists dates inclusively", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(eachDay("2026-10-02", "2026-10-01")).toEqual([]);
  });
});
