import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { habits, questHabits, quests } from "@/lib/db/schema";
import type { HabitUnit, QuestPeriod } from "@/lib/types";

export type QuestSummary = {
  id: number;
  name: string;
  period: QuestPeriod;
  startDate: string;
  endDate: string;
  habits: { habitId: number; name: string; icon: string; color: string; unit: HabitUnit; dailyTarget: number }[];
};

export async function listQuests(userId: number): Promise<QuestSummary[]> {
  const rows = await db
    .select({
      quest: { id: quests.id, name: quests.name, period: quests.period, startDate: quests.startDate, endDate: quests.endDate },
      habit: {
        habitId: habits.id,
        name: habits.name,
        icon: habits.icon,
        color: habits.color,
        unit: habits.unit,
        dailyTarget: questHabits.dailyTarget,
      },
    })
    .from(quests)
    .innerJoin(questHabits, eq(questHabits.questId, quests.id))
    .innerJoin(habits, eq(questHabits.habitId, habits.id))
    .where(eq(quests.userId, userId))
    .orderBy(desc(quests.startDate), asc(quests.id), asc(habits.id));

  const byQuest = new Map<number, QuestSummary>();
  for (const { quest, habit } of rows) {
    const summary = byQuest.get(quest.id) ?? { ...quest, habits: [] };
    summary.habits.push(habit);
    byQuest.set(quest.id, summary);
  }
  return [...byQuest.values()];
}

export async function listLibraryHabits(userId: number) {
  return db
    .select({
      id: habits.id,
      name: habits.name,
      unit: habits.unit,
      defaultTarget: habits.defaultTarget,
      icon: habits.icon,
      color: habits.color,
    })
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.archived, false)))
    .orderBy(asc(habits.id));
}

export async function getQuest(userId: number, questId: number): Promise<QuestSummary | null> {
  const all = await listQuests(userId);
  return all.find((q) => q.id === questId) ?? null;
}

/** All of the user's habits (including archived) for labeling stats. */
export async function listUserHabits(userId: number) {
  return db
    .select({ id: habits.id, name: habits.name, unit: habits.unit, icon: habits.icon, color: habits.color })
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(asc(habits.id));
}
