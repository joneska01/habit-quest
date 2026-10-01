import { describe, expect, it } from "vitest";

import { NUDGE_HOUR, nudgeFor } from "./nudge";
import type { DayHabit } from "./targets";

const habit = (habitId: number, name: string, amount: number, target: number, unit: DayHabit["unit"] = "count"): DayHabit => ({
  habitId,
  name,
  unit,
  icon: "⭐",
  color: "coin",
  target,
  amount,
  quests: ["October 2026"],
});

const pushups = habit(2, "Push-ups", 40, 100);
const reading = habit(5, "Reading", 0, 20, "minutes");
const squats = habit(1, "Squats", 100, 100);
const evening = NUDGE_HOUR;

describe("nudgeFor", () => {
  it("stays quiet before the nudge hour", () => {
    expect(nudgeFor({ dayHabits: [pushups], perfectStreak: 3, habitStreaks: {}, hour: NUDGE_HOUR - 1 })).toBeNull();
  });

  it("stays quiet when everything is cleared or nothing is tracked", () => {
    expect(nudgeFor({ dayHabits: [squats], perfectStreak: 3, habitStreaks: {}, hour: evening })).toBeNull();
    expect(nudgeFor({ dayHabits: [], perfectStreak: 0, habitStreaks: {}, hour: evening })).toBeNull();
  });

  it("leads with a perfect-day streak at risk and lists what's left", () => {
    expect(
      nudgeFor({ dayHabits: [squats, pushups, reading], perfectStreak: 6, habitStreaks: {}, hour: 19 }),
    ).toEqual({
      title: "🔥 6-day perfect streak on the line!",
      body: "2 left: Push-ups 40/100, Reading 0/20 min. +45 XP up for grabs.",
    });
  });

  it("falls back to the longest habit streak at risk", () => {
    const n = nudgeFor({ dayHabits: [squats, pushups, reading], perfectStreak: 0, habitStreaks: { 2: 4, 5: 9 }, hour: evening });
    expect(n?.title).toBe("🔥 Reading's 9-day streak is on the line!");
  });

  it("calls out an empty day", () => {
    const n = nudgeFor({ dayHabits: [habit(2, "Push-ups", 0, 100), reading], perfectStreak: 0, habitStreaks: {}, hour: evening });
    expect(n?.title).toBe("Nothing logged yet today");
    expect(n?.body).toBe("2 left: Push-ups 0/100, Reading 0/20 min. +45 XP up for grabs.");
  });

  it("otherwise counts what's left, singular, and caps the list at 3", () => {
    expect(nudgeFor({ dayHabits: [squats, pushups], perfectStreak: 0, habitStreaks: {}, hour: evening })?.title).toBe(
      "1 habit left today",
    );
    const many = [1, 2, 3, 4, 5].map((id) => habit(id, `H${id}`, 1, 10));
    const n = nudgeFor({ dayHabits: many, perfectStreak: 0, habitStreaks: {}, hour: evening });
    expect(n?.body).toBe("5 left: H1 1/10, H2 1/10, H3 1/10 +2 more. +75 XP up for grabs.");
  });

  it("names check habits without numbers", () => {
    const n = nudgeFor({ dayHabits: [squats, habit(9, "Water", 0, 1, "check")], perfectStreak: 0, habitStreaks: {}, hour: evening });
    expect(n?.body).toBe("1 left: Water. +35 XP up for grabs.");
  });
});
