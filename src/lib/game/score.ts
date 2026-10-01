// Game scoring (spec §4). Pure: everything is recomputed from logs on each render,
// so backfilling a past day automatically re-scores XP, levels and streaks.
import { addDays } from "../dates";
import { levelFromXp, type LevelInfo } from "./levels";

export const XP_PER_HABIT = 10;
export const XP_PERFECT_DAY = 25;

export type QuestHabitWindow = { habitId: number; dailyTarget: number; startDate: string; endDate: string };
export type LogEntry = { habitId: number; date: string; amount: number };
/** date → habitId → that day's target */
export type TargetCalendar = Map<string, Map<number, number>>;
export type DayScore = { date: string; met: number; total: number; perfect: boolean; metHabits: Set<number> };

export type GameState = LevelInfo & {
  xp: number;
  perfectStreak: number;
  habitStreaks: Record<number, number>;
};

export function buildTargetCalendar(windows: QuestHabitWindow[], today: string): TargetCalendar {
  const calendar: TargetCalendar = new Map();
  for (const w of windows) {
    const last = w.endDate < today ? w.endDate : today;
    for (let date = w.startDate; date <= last; date = addDays(date, 1)) {
      const day = calendar.get(date) ?? new Map<number, number>();
      day.set(w.habitId, Math.max(day.get(w.habitId) ?? 0, w.dailyTarget));
      calendar.set(date, day);
    }
  }
  return new Map([...calendar.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function scoreDays(calendar: TargetCalendar, logs: LogEntry[]): DayScore[] {
  const amounts = new Map(logs.map((l) => [`${l.habitId}|${l.date}`, l.amount]));
  return [...calendar.entries()].map(([date, targets]) => {
    const metHabits = new Set(
      [...targets.entries()]
        .filter(([habitId, target]) => (amounts.get(`${habitId}|${date}`) ?? 0) >= target)
        .map(([habitId]) => habitId),
    );
    return { date, met: metHabits.size, total: targets.size, perfect: metHabits.size === targets.size, metHabits };
  });
}

export function totalXp(days: DayScore[]): number {
  return days.reduce((sum, d) => sum + d.met * XP_PER_HABIT + (d.perfect ? XP_PERFECT_DAY : 0), 0);
}

/**
 * Consecutive met days ending today. `days` holds only targeted days (untargeted
 * gaps are skipped, not broken). An unfinished today doesn't break the streak.
 */
export function streak(days: { date: string; met: boolean }[], today: string): number {
  const newestFirst = [...days].sort((a, b) => b.date.localeCompare(a.date));
  if (newestFirst[0]?.date === today && !newestFirst[0].met) newestFirst.shift();
  let count = 0;
  for (const d of newestFirst) {
    if (!d.met) break;
    count++;
  }
  return count;
}

export function computeGameState(windows: QuestHabitWindow[], logs: LogEntry[], today: string): GameState {
  const calendar = buildTargetCalendar(windows, today);
  const days = scoreDays(calendar, logs);
  const xp = totalXp(days);

  const habitIds = new Set(windows.map((w) => w.habitId));
  const habitStreaks: Record<number, number> = {};
  for (const habitId of habitIds) {
    const targeted = days
      .filter((d) => calendar.get(d.date)?.has(habitId))
      .map((d) => ({ date: d.date, met: d.metHabits.has(habitId) }));
    habitStreaks[habitId] = streak(targeted, today);
  }

  return {
    xp,
    ...levelFromXp(xp),
    perfectStreak: streak(
      days.map((d) => ({ date: d.date, met: d.perfect })),
      today,
    ),
    habitStreaks,
  };
}
