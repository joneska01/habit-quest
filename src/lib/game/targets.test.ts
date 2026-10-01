import { describe, expect, it } from "vitest";

import { buildDayHabits, type DayHabitRow } from "./targets";

const pushups: Omit<DayHabitRow, "dailyTarget" | "questName"> = {
  habitId: 2,
  name: "Push-ups",
  unit: "count",
  icon: "💪",
  color: "berry",
};

describe("buildDayHabits", () => {
  it("uses the row's target and defaults amount to 0", () => {
    const result = buildDayHabits([{ ...pushups, dailyTarget: 100, questName: "October 2026" }], []);
    expect(result).toEqual([{ ...pushups, target: 100, amount: 0, quests: ["October 2026"] }]);
  });

  it("takes the max target when quests overlap", () => {
    const result = buildDayHabits(
      [
        { ...pushups, dailyTarget: 100, questName: "October 2026" },
        { ...pushups, dailyTarget: 150, questName: "Week of Oct 5" },
      ],
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe(150);
    expect(result[0].quests).toEqual(["October 2026", "Week of Oct 5"]);
  });

  it("matches logs by habit and sorts by habit id", () => {
    const squats = { habitId: 1, name: "Squats", unit: "count" as const, icon: "🦵", color: "brick" };
    const result = buildDayHabits(
      [
        { ...pushups, dailyTarget: 100, questName: "October 2026" },
        { ...squats, dailyTarget: 100, questName: "October 2026" },
      ],
      [{ habitId: 2, amount: 40 }],
    );
    expect(result.map((h) => [h.habitId, h.amount])).toEqual([
      [1, 0],
      [2, 40],
    ]);
  });
});
