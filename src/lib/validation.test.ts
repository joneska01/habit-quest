import { describe, expect, it } from "vitest";

import { createHabitSchema, createQuestSchema, logProgressSchema } from "./validation";

describe("logProgressSchema", () => {
  const base = { habitId: 1, date: "2026-10-01" };
  it("accepts a positive add and a zero set", () => {
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: 25 }).success).toBe(true);
    expect(logProgressSchema.safeParse({ ...base, mode: "set", amount: 0 }).success).toBe(true);
  });
  it("rejects negative or zero adds, fractions, and bad dates", () => {
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: 0 }).success).toBe(false);
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: -5 }).success).toBe(false);
    expect(logProgressSchema.safeParse({ ...base, mode: "set", amount: 2.5 }).success).toBe(false);
    expect(logProgressSchema.safeParse({ ...base, date: "2026-02-30", mode: "set", amount: 1 }).success).toBe(false);
  });
});

describe("createHabitSchema", () => {
  const valid = { name: "  Water ", unit: "count", defaultTarget: "8", color: "ocean", icon: "💧" };
  it("trims names and coerces the target", () => {
    const parsed = createHabitSchema.parse(valid);
    expect(parsed.name).toBe("Water");
    expect(parsed.defaultTarget).toBe(8);
  });
  it("forces check habits to a target of 1", () => {
    expect(createHabitSchema.parse({ ...valid, unit: "check", defaultTarget: "" }).defaultTarget).toBe(1);
  });
  it("rejects unknown colors and empty names", () => {
    expect(createHabitSchema.safeParse({ ...valid, color: "black" }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

describe("createQuestSchema", () => {
  const valid = {
    name: "Week of Oct 5",
    period: "week",
    startDate: "2026-10-05",
    habits: [{ habitId: 1, dailyTarget: 100 }],
  };
  it("accepts a valid quest", () => {
    expect(createQuestSchema.safeParse(valid).success).toBe(true);
  });
  it("requires at least one habit and no duplicates", () => {
    expect(createQuestSchema.safeParse({ ...valid, habits: [] }).success).toBe(false);
    expect(
      createQuestSchema.safeParse({
        ...valid,
        habits: [
          { habitId: 1, dailyTarget: 100 },
          { habitId: 1, dailyTarget: 50 },
        ],
      }).success,
    ).toBe(false);
  });
});
