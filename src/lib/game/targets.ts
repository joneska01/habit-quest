import type { HabitUnit } from "../types";

/** One quest_habit row that is active on the day being built. */
export type DayHabitRow = {
  habitId: number;
  name: string;
  unit: HabitUnit;
  icon: string;
  color: string;
  dailyTarget: number;
  questName: string;
};

export type DayHabit = Omit<DayHabitRow, "dailyTarget" | "questName"> & {
  target: number;
  amount: number;
  quests: string[];
};

/**
 * Collapse a day's quest-habit rows into one entry per habit (spec §4):
 * when quests overlap, the habit's target for that day is the highest target.
 */
export function buildDayHabits(rows: DayHabitRow[], logs: { habitId: number; amount: number }[]): DayHabit[] {
  const amounts = new Map(logs.map((l) => [l.habitId, l.amount]));
  const byHabit = new Map<number, DayHabit>();

  for (const { dailyTarget, questName, ...habit } of rows) {
    const existing = byHabit.get(habit.habitId);
    if (existing) {
      existing.target = Math.max(existing.target, dailyTarget);
      existing.quests.push(questName);
    } else {
      byHabit.set(habit.habitId, {
        ...habit,
        target: dailyTarget,
        amount: amounts.get(habit.habitId) ?? 0,
        quests: [questName],
      });
    }
  }

  return [...byHabit.values()].sort((a, b) => a.habitId - b.habitId);
}
