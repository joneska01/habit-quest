import "server-only";

import { and, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { habits, logs, questHabits, quests } from "@/lib/db/schema";
import { buildDayHabits, type DayHabit } from "@/lib/game/targets";

/** Every habit with a target on `date` (from any quest covering it), plus that day's logged amount. */
export async function getDayHabits(userId: number, date: string): Promise<DayHabit[]> {
  const rows = await db
    .select({
      habitId: habits.id,
      name: habits.name,
      unit: habits.unit,
      icon: habits.icon,
      color: habits.color,
      dailyTarget: questHabits.dailyTarget,
      questName: quests.name,
    })
    .from(questHabits)
    .innerJoin(quests, eq(questHabits.questId, quests.id))
    .innerJoin(habits, eq(questHabits.habitId, habits.id))
    .where(
      and(
        eq(quests.userId, userId),
        lte(quests.startDate, date),
        gte(quests.endDate, date),
        eq(habits.archived, false),
      ),
    )
    .orderBy(quests.startDate);

  if (rows.length === 0) return [];

  const dayLogs = await db
    .select({ habitId: logs.habitId, amount: logs.amount })
    .from(logs)
    .where(
      and(
        eq(logs.userId, userId),
        eq(logs.date, date),
        inArray(
          logs.habitId,
          rows.map((r) => r.habitId),
        ),
      ),
    );

  return buildDayHabits(rows, dayLogs);
}
