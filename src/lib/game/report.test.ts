import { describe, expect, it } from "vitest";

import { grade, longestStreak, questReport } from "./report";

describe("grade", () => {
  it.each([
    [100, "S"],
    [95, "S"],
    [94.9, "A"],
    [85, "A"],
    [70, "B"],
    [50, "C"],
    [49.9, "D"],
    [0, "D"],
  ])("%s%% → %s", (pct, expected) => {
    expect(grade(pct)).toBe(expected);
  });
});

describe("longestStreak", () => {
  it("finds the longest run of met days", () => {
    const met = [true, true, false, true, true, true, false, true].map((m, i) => ({
      date: `2026-10-0${i + 1}`,
      met: m,
    }));
    expect(longestStreak(met)).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe("questReport", () => {
  const SQUATS = 1;
  const READING = 5;
  const quest = {
    startDate: "2026-10-01",
    endDate: "2026-10-04",
    habits: [
      { habitId: SQUATS, dailyTarget: 100 },
      { habitId: READING, dailyTarget: 20 },
    ],
  };
  const windows = quest.habits.map((h) => ({ ...h, startDate: quest.startDate, endDate: quest.endDate }));
  const logs = [
    { habitId: SQUATS, date: "2026-10-01", amount: 100 },
    { habitId: READING, date: "2026-10-01", amount: 20 },
    { habitId: SQUATS, date: "2026-10-02", amount: 50 },
    { habitId: READING, date: "2026-10-02", amount: 30 },
    { habitId: SQUATS, date: "2026-10-03", amount: 120 },
    { habitId: SQUATS, date: "2026-09-30", amount: 999 }, // outside the window
  ];

  it("scores only elapsed days while active", () => {
    const r = questReport(quest, windows, logs, "2026-10-02");
    expect(r.status).toBe("active");
    expect(r.daysElapsed).toBe(2);
    expect(r.daysTotal).toBe(4);
    // cells: 1, 1, 0.5, 1 → 87.5%
    expect(r.completionPct).toBe(87.5);
    expect(r.grade).toBe("A");
    // Oct 1 perfect (10+10+25) + Oct 2 reading only (10)
    expect(r.xpEarned).toBe(55);
  });

  it("scores the whole window once ended, treating missing logs as 0", () => {
    const r = questReport(quest, windows, logs, "2026-10-10");
    expect(r.status).toBe("completed");
    expect(r.daysElapsed).toBe(4);
    // squats 1, .5, 1, 0 ; reading 1, 1, 0, 0 → 4.5 / 8
    expect(r.completionPct).toBe(56.25);
    expect(r.grade).toBe("C");
    expect(r.habits).toEqual([
      { habitId: SQUATS, total: 270, daysMet: 2, bestStreak: 1 },
      { habitId: READING, total: 50, daysMet: 2, bestStreak: 2 },
    ]);
  });

  it("has no grade before the quest starts", () => {
    const r = questReport(quest, windows, logs, "2026-09-30");
    expect(r.status).toBe("upcoming");
    expect(r.daysElapsed).toBe(0);
    expect(r.grade).toBeNull();
  });
});
