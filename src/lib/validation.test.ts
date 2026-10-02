import { describe, expect, it } from "vitest";

import {
  createHabitSchema,
  createQuestSchema,
  logProgressSchema,
  pushSubscriptionSchema,
  updateQuestHabitsSchema,
} from "./validation";

describe("logProgressSchema", () => {
  const base = { habitId: 1, date: "2026-10-01" };
  it("accepts a positive add and a zero set", () => {
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: 25 }).success).toBe(true);
    expect(logProgressSchema.safeParse({ ...base, mode: "set", amount: 0 }).success).toBe(true);
  });
  it("accepts a negative add (undo)", () => {
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: -25 }).success).toBe(true);
  });
  it("rejects zero adds, out-of-range adds, negative sets, fractions, and bad dates", () => {
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: 0 }).success).toBe(false);
    expect(logProgressSchema.safeParse({ ...base, mode: "add", amount: -1_000_001 }).success).toBe(false);
    expect(logProgressSchema.safeParse({ ...base, mode: "set", amount: -5 }).success).toBe(false);
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

describe("pushSubscriptionSchema", () => {
  const valid = {
    endpoint: "https://web.push.apple.com/abc123",
    keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" },
  };
  it("accepts a browser subscription", () => {
    expect(pushSubscriptionSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects non-https endpoints and missing keys", () => {
    expect(pushSubscriptionSchema.safeParse({ ...valid, endpoint: "http://evil.example/x" }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ endpoint: valid.endpoint, keys: { auth: "x" } }).success).toBe(false);
  });
});

describe("updateQuestHabitsSchema", () => {
  it("accepts a quest id with at least one unique habit", () => {
    expect(updateQuestHabitsSchema.safeParse({ questId: 1, habits: [{ habitId: 2, dailyTarget: 50 }] }).success).toBe(true);
  });
  it("rejects an empty habit list (a quest needs at least one habit)", () => {
    expect(updateQuestHabitsSchema.safeParse({ questId: 1, habits: [] }).success).toBe(false);
  });
});
