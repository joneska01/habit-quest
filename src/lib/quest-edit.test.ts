import { describe, expect, it } from "vitest";

import { diffQuestHabits, hasChanges } from "./quest-edit";

const current = [
  { habitId: 1, dailyTarget: 100 },
  { habitId: 2, dailyTarget: 100 },
  { habitId: 5, dailyTarget: 20 },
];

describe("diffQuestHabits", () => {
  it("finds added, removed and retargeted habits", () => {
    const next = [
      { habitId: 1, dailyTarget: 100 },
      { habitId: 5, dailyTarget: 30 },
      { habitId: 9, dailyTarget: 8 },
    ];
    expect(diffQuestHabits(current, next)).toEqual({
      added: [9],
      removed: [2],
      retargeted: [{ habitId: 5, from: 20, to: 30 }],
    });
  });

  it("reports no changes when nothing differs (order doesn't matter)", () => {
    const diff = diffQuestHabits(current, [...current].reverse());
    expect(diff).toEqual({ added: [], removed: [], retargeted: [] });
    expect(hasChanges(diff)).toBe(false);
  });

  it("hasChanges is true for any difference", () => {
    expect(hasChanges(diffQuestHabits(current, current.slice(0, 2)))).toBe(true);
  });
});
