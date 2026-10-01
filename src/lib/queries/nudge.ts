import "server-only";

import { hourInChicago, todayInChicago } from "@/lib/dates";
import { nudgeFor, type Nudge } from "@/lib/game/nudge";

import { getDayHabits } from "./day";
import { getGameState } from "./game";

/**
 * Today's nudge for a user (same message the banner shows), or null if nothing to say.
 * `hourOverride` lets the "send test" button preview the evening message any time of day.
 */
export async function getNudgeForUser(userId: number, now: Date = new Date(), hourOverride?: number): Promise<Nudge | null> {
  const today = todayInChicago(now);
  const [dayHabits, { perfectStreak, habitStreaks }] = await Promise.all([
    getDayHabits(userId, today),
    getGameState(userId, today),
  ]);
  return nudgeFor({ dayHabits, perfectStreak, habitStreaks, hour: hourOverride ?? hourInChicago(now) });
}
