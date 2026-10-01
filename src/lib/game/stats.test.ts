import { describe, expect, it } from "vitest";

import { heatBin, yearSummary } from "./stats";

describe("heatBin", () => {
  it.each([
    [undefined, -1],
    [0, 0],
    [0.3, 1],
    [0.5, 2],
    [0.79, 2],
    [0.8, 3],
    [0.99, 3],
    [1, 4],
  ])("%s → %s", (fraction, bin) => {
    expect(heatBin(fraction)).toBe(bin);
  });
});

describe("yearSummary", () => {
  const SQUATS = 1;
  const READING = 5;
  const windows = [
    { habitId: SQUATS, dailyTarget: 100, startDate: "2026-12-30", endDate: "2027-01-02" },
    { habitId: READING, dailyTarget: 20, startDate: "2026-12-30", endDate: "2027-01-02" },
  ];
  const logs = [
    { habitId: SQUATS, date: "2026-12-30", amount: 100 },
    { habitId: READING, date: "2026-12-30", amount: 20 },
    { habitId: SQUATS, date: "2026-12-31", amount: 50 },
    { habitId: SQUATS, date: "2027-01-01", amount: 100 },
  ];

  it("totals only the requested year", () => {
    const s = yearSummary(windows, logs, 2026, "2027-01-02");
    expect(s.habits).toEqual([
      { habitId: SQUATS, total: 150, daysMet: 1 },
      { habitId: READING, total: 20, daysMet: 1 },
    ]);
    expect(s.perfectDays).toBe(1);
    expect(s.activeDays).toBe(2);
    expect(s.xp).toBe(45); // Dec 30 perfect only
    expect(s.completion.get("2026-12-30")).toBe(1);
    expect(s.completion.get("2026-12-31")).toBe(0.25); // squats .5, reading 0
    expect(s.completion.has("2027-01-01")).toBe(false);
  });

  it("stops at today", () => {
    const s = yearSummary(windows, logs, 2026, "2026-12-30");
    expect(s.activeDays).toBe(1);
    expect(s.completion.has("2026-12-31")).toBe(false);
  });
});
