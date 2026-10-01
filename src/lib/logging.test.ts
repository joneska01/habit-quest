import { describe, expect, it } from "vitest";

import { formatAmount, niceRound, progressFraction, quickAddAmounts, unitLabel } from "./logging";

describe("niceRound", () => {
  it.each([
    [10, 10],
    [25, 25],
    [50, 50],
    [1000, 1000],
    [2500, 2500],
    [2, 2],
    [7, 5],
    [0.3, 1],
    [13, 10],
    [40, 50],
  ])("niceRound(%s) = %s", (input, expected) => {
    expect(niceRound(input)).toBe(expected);
  });
});

describe("quickAddAmounts", () => {
  it("sizes buttons to the target", () => {
    expect(quickAddAmounts(100)).toEqual([10, 25, 50]);
    expect(quickAddAmounts(10000)).toEqual([1000, 2500, 5000]);
    expect(quickAddAmounts(20)).toEqual([2, 5, 10]);
  });
  it("dedupes tiny targets", () => {
    expect(quickAddAmounts(1)).toEqual([1]);
  });
});

describe("progressFraction", () => {
  it("clamps between 0 and 1", () => {
    expect(progressFraction(50, 100)).toBe(0.5);
    expect(progressFraction(150, 100)).toBe(1);
    expect(progressFraction(0, 0)).toBe(0);
  });
});

describe("display helpers", () => {
  it("formats amounts with separators", () => {
    expect(formatAmount(10000)).toBe("10,000");
  });
  it("labels units", () => {
    expect(unitLabel("minutes")).toBe("min");
    expect(unitLabel("count")).toBe("");
    expect(unitLabel("check")).toBe("");
  });
});
