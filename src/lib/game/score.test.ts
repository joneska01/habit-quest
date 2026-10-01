import { describe, expect, it } from "vitest";

import { buildTargetCalendar, computeGameState, scoreDays, streak, totalXp } from "./score";

const SQUATS = 1;
const READING = 5;
const october = (habitId: number, dailyTarget: number) => ({
  habitId,
  dailyTarget,
  startDate: "2026-10-01",
  endDate: "2026-10-31",
});

describe("buildTargetCalendar", () => {
  it("only includes days up to today", () => {
    const cal = buildTargetCalendar([{ habitId: SQUATS, dailyTarget: 100, startDate: "2026-10-01", endDate: "2026-10-03" }], "2026-10-02");
    expect([...cal.keys()]).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("uses the max target where quests overlap", () => {
    const cal = buildTargetCalendar(
      [october(SQUATS, 100), { habitId: SQUATS, dailyTarget: 150, startDate: "2026-10-02", endDate: "2026-10-08" }],
      "2026-10-02",
    );
    expect(cal.get("2026-10-01")?.get(SQUATS)).toBe(100);
    expect(cal.get("2026-10-02")?.get(SQUATS)).toBe(150);
  });

  it("ignores quests that haven't started", () => {
    const cal = buildTargetCalendar([{ ...october(SQUATS, 100), startDate: "2026-11-01", endDate: "2026-11-30" }], "2026-10-15");
    expect(cal.size).toBe(0);
  });
});

describe("scoreDays + totalXp", () => {
  const cal = buildTargetCalendar([october(SQUATS, 100), october(READING, 20)], "2026-10-02");

  it("scores met, total and perfect per day", () => {
    const days = scoreDays(cal, [
      { habitId: SQUATS, date: "2026-10-01", amount: 100 },
      { habitId: READING, date: "2026-10-01", amount: 25 },
      { habitId: SQUATS, date: "2026-10-02", amount: 120 },
      { habitId: READING, date: "2026-10-02", amount: 5 },
    ]);
    expect(days.map(({ date, met, total, perfect }) => ({ date, met, total, perfect }))).toEqual([
      { date: "2026-10-01", met: 2, total: 2, perfect: true },
      { date: "2026-10-02", met: 1, total: 2, perfect: false },
    ]);
    // Oct 1: 2×10 + 25 perfect bonus; Oct 2: 1×10
    expect(totalXp(days)).toBe(55);
  });
});

describe("streak", () => {
  const met = (date: string) => ({ date, met: true });
  const missed = (date: string) => ({ date, met: false });

  it("counts consecutive met days", () => {
    expect(streak([met("2026-10-01"), met("2026-10-02"), met("2026-10-03")], "2026-10-03")).toBe(3);
  });

  it("doesn't break on an unfinished today", () => {
    expect(streak([met("2026-10-01"), met("2026-10-02"), missed("2026-10-03")], "2026-10-03")).toBe(2);
  });

  it("stops at the first miss before today", () => {
    expect(streak([met("2026-10-01"), missed("2026-10-02"), met("2026-10-03")], "2026-10-03")).toBe(1);
  });

  it("skips untargeted gap days (they simply aren't in the list)", () => {
    expect(streak([met("2026-10-01"), met("2026-10-05")], "2026-10-05")).toBe(2);
  });

  it("is 0 with no met days", () => {
    expect(streak([], "2026-10-03")).toBe(0);
    expect(streak([missed("2026-10-02")], "2026-10-03")).toBe(0);
  });
});

describe("computeGameState", () => {
  const windows = [october(SQUATS, 100), october(READING, 20)];
  const logs = [
    { habitId: SQUATS, date: "2026-10-01", amount: 100 },
    { habitId: READING, date: "2026-10-01", amount: 20 },
    { habitId: SQUATS, date: "2026-10-02", amount: 100 },
    { habitId: READING, date: "2026-10-02", amount: 5 },
    { habitId: SQUATS, date: "2026-10-03", amount: 50 },
  ];

  it("adds up XP, level and streaks", () => {
    expect(computeGameState(windows, logs, "2026-10-03")).toEqual({
      xp: 55,
      level: 1,
      xpIntoLevel: 55,
      xpForNextLevel: 100,
      perfectStreak: 0,
      habitStreaks: { [SQUATS]: 2, [READING]: 0 },
    });
  });

  it("re-scores when a missed day is backfilled", () => {
    const backfilled = [...logs, { habitId: READING, date: "2026-10-02", amount: 20 }];
    const state = computeGameState(windows, backfilled, "2026-10-03");
    expect(state.xp).toBe(45 + 45); // two perfect days
    expect(state.perfectStreak).toBe(2);
    expect(state.habitStreaks[READING]).toBe(2);
  });

  it("ignores logs dated after today", () => {
    const state = computeGameState(windows, [{ habitId: SQUATS, date: "2026-10-04", amount: 100 }], "2026-10-03");
    expect(state.xp).toBe(0);
  });
});
