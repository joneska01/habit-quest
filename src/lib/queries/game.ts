import "server-only";

import { and, eq, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { logs, questHabits, quests } from "@/lib/db/schema";
import { computeGameState, type GameState } from "@/lib/game/score";

/** Everything up to today, scored from scratch (nothing is stored — spec §4). */
export async function getGameState(userId: number, today: string): Promise<GameState> {
  const [windows, allLogs] = await Promise.all([
    db
      .select({
        habitId: questHabits.habitId,
        dailyTarget: questHabits.dailyTarget,
        startDate: quests.startDate,
        endDate: quests.endDate,
      })
      .from(questHabits)
      .innerJoin(quests, eq(questHabits.questId, quests.id))
      .where(and(eq(quests.userId, userId), lte(quests.startDate, today))),
    db
      .select({ habitId: logs.habitId, date: logs.date, amount: logs.amount })
      .from(logs)
      .where(and(eq(logs.userId, userId), lte(logs.date, today))),
  ]);

  return computeGameState(windows, allLogs, today);
}
