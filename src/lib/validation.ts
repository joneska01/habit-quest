import { z } from "zod";

import { isIsoDate } from "./dates";
import { HABIT_COLORS, HABIT_ICONS } from "./palette";
import { HABIT_UNITS, QUEST_PERIODS } from "./types";

export const MAX_AMOUNT = 1_000_000;

const isoDate = z.string().refine(isIsoDate, "Invalid date");
const id = z.number().int().positive();

export const logProgressSchema = z.discriminatedUnion("mode", [
  // Negative adds are undo; zero is a no-op and rejected.
  z.object({
    mode: z.literal("add"),
    habitId: id,
    date: isoDate,
    amount: z
      .number()
      .int()
      .min(-MAX_AMOUNT)
      .max(MAX_AMOUNT)
      .refine((n) => n !== 0, "Amount can't be zero"),
  }),
  z.object({ mode: z.literal("set"), habitId: id, date: isoDate, amount: z.number().int().min(0).max(MAX_AMOUNT) }),
]);
export type LogProgressInput = z.infer<typeof logProgressSchema>;

export const createHabitSchema = z
  .object({
    name: z.string().trim().min(1, "Give it a name").max(40),
    unit: z.enum(HABIT_UNITS),
    defaultTarget: z.string(),
    color: z.enum(HABIT_COLORS),
    icon: z.enum(HABIT_ICONS),
  })
  .transform((h, ctx) => {
    if (h.unit === "check") return { ...h, defaultTarget: 1 };
    const target = Number(h.defaultTarget);
    if (!Number.isInteger(target) || target < 1 || target > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "Target must be a whole number above 0", path: ["defaultTarget"] });
      return z.NEVER;
    }
    return { ...h, defaultTarget: target };
  });

export const createQuestSchema = z.object({
  name: z.string().trim().min(1, "Give your quest a name").max(60),
  period: z.enum(QUEST_PERIODS),
  startDate: isoDate,
  habits: z
    .array(z.object({ habitId: id, dailyTarget: z.number().int().min(1).max(MAX_AMOUNT) }))
    .min(1, "Pick at least one habit")
    .refine((hs) => new Set(hs.map((h) => h.habitId)).size === hs.length, "Each habit can only be added once"),
});
export type CreateQuestInput = z.infer<typeof createQuestSchema>;

/** Editing a quest's habits reuses the same habit rules as creating one. */
export const updateQuestHabitsSchema = z.object({
  questId: id,
  habits: createQuestSchema.shape.habits,
});
export type UpdateQuestHabitsInput = z.infer<typeof updateQuestHabitsSchema>;

/** A browser PushSubscription.toJSON(), saved so the server can push to it. */
export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
