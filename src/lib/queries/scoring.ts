import "server-only";

import { and, eq, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { logs, questHabits, quests } from "@/lib/db/schema";
import type { LogEntry, QuestHabitWindow } from "@/lib/game/score";

/** The raw inputs every scoring function needs: quest-habit windows and logs up to `upTo`. */
export async function loadScoringData(
  userId: number,
  upTo: string,
): Promise<{ windows: QuestHabitWindow[]; logs: LogEntry[] }> {
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
      .where(and(eq(quests.userId, userId), lte(quests.startDate, upTo))),
    db
      .select({ habitId: logs.habitId, date: logs.date, amount: logs.amount })
      .from(logs)
      .where(and(eq(logs.userId, userId), lte(logs.date, upTo))),
  ]);
  return { windows, logs: allLogs };
}
