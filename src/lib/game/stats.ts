// Year stats + heatmap data (spec §6). Pure.
import { buildTargetCalendar, scoreDays, totalXp, type LogEntry, type QuestHabitWindow } from "./score";

/** Heatmap bin: -1 no quest that day, 0 nothing, 1 <50%, 2 <80%, 3 <100%, 4 complete. */
export function heatBin(fraction: number | undefined): -1 | 0 | 1 | 2 | 3 | 4 {
  if (fraction === undefined) return -1;
  if (fraction <= 0) return 0;
  if (fraction < 0.5) return 1;
  if (fraction < 0.8) return 2;
  if (fraction < 1) return 3;
  return 4;
}

export type YearSummary = {
  xp: number;
  perfectDays: number;
  activeDays: number;
  habits: { habitId: number; total: number; daysMet: number }[];
  /** date → average of min(amount/target, 1) across that day's targeted habits */
  completion: Map<string, number>;
};

export function yearSummary(windows: QuestHabitWindow[], logs: LogEntry[], year: number, today: string): YearSummary {
  const prefix = `${year}-`;
  const yearEnd = `${year}-12-31`;
  const calendar = buildTargetCalendar(windows, today < yearEnd ? today : yearEnd);
  const days = scoreDays(calendar, logs).filter((d) => d.date.startsWith(prefix));
  const yearLogs = logs.filter((l) => l.date.startsWith(prefix) && l.date <= today);
  const amounts = new Map(yearLogs.map((l) => [`${l.habitId}|${l.date}`, l.amount]));

  const completion = new Map<string, number>();
  for (const d of days) {
    const targets = calendar.get(d.date)!;
    let sum = 0;
    for (const [habitId, target] of targets) sum += Math.min((amounts.get(`${habitId}|${d.date}`) ?? 0) / target, 1);
    completion.set(d.date, sum / targets.size);
  }

  const habitIds = [...new Set([...windows.map((w) => w.habitId), ...yearLogs.map((l) => l.habitId)])].sort((a, b) => a - b);
  const habits = habitIds
    .map((habitId) => ({
      habitId,
      total: yearLogs.filter((l) => l.habitId === habitId).reduce((sum, l) => sum + l.amount, 0),
      daysMet: days.filter((d) => d.metHabits.has(habitId)).length,
    }))
    .filter((h) => h.total > 0 || days.some((d) => calendar.get(d.date)?.has(h.habitId)));

  return {
    xp: totalXp(days),
    perfectDays: days.filter((d) => d.perfect).length,
    activeDays: days.length,
    habits,
    completion,
  };
}
