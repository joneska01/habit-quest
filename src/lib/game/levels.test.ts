import { describe, expect, it } from "vitest";

import { levelCost, levelFromXp } from "./levels";

describe("levelCost", () => {
  it("grows by 25 XP per level", () => {
    expect([1, 2, 3, 4].map(levelCost)).toEqual([100, 125, 150, 175]);
  });
});

describe("levelFromXp", () => {
  it.each([
    [0, 1, 0, 100],
    [99, 1, 99, 100],
    [100, 2, 0, 125],
    [224, 2, 124, 125],
    [225, 3, 0, 150],
    [375, 4, 0, 175],
  ])("%s XP → level %s (%s/%s)", (xp, level, xpIntoLevel, xpForNextLevel) => {
    expect(levelFromXp(xp)).toEqual({ level, xpIntoLevel, xpForNextLevel });
  });
});
