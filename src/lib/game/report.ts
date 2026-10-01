// Quest results (spec §4/§6): completion %, grade, per-habit totals, best streaks.
import { eachDay } from "../dates";
import { questStatus, type QuestStatus } from "../quests";
import { buildTargetCalendar, scoreDays, totalXp, type LogEntry, type QuestHabitWindow } from "./score";

export type Grade = "S" | "A" | "B" | "C" | "D";

export function grade(pct: number): Grade {
  if (pct >= 95) return "S";
  if (pct >= 85) return "A";
  if (pct >= 70) return "B";
  if (pct >= 50) return "C";
  return "D";
}

/** Longest run of consecutive met entries (entries are consecutive targeted days). */
export function longestStreak(days: { date: string; met: boolean }[]): number {
  let best = 0;
  let run = 0;
  for (const d of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    run = d.met ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export type QuestForReport = {
  startDate: string;
  endDate: string;
  habits: { habitId: number; dailyTarget: number }[];
};

export type HabitReport = { habitId: number; total: number; daysMet: number; bestStreak: number };

export type QuestReport = {
  status: QuestStatus;
  daysElapsed: number;
  daysTotal: number;
  completionPct: number;
  grade: Grade | null;
  xpEarned: number;
  habits: HabitReport[];
};

/**
 * Completion uses this quest's own targets; XP is the global per-day XP
 * (all quests) earned on the quest's dates.
 */
export function questReport(
  quest: QuestForReport,
  allWindows: QuestHabitWindow[],
  logs: LogEntry[],
  today: string,
): QuestReport {
  const status = questStatus(quest, today);
  const lastDay = quest.endDate < today ? quest.endDate : today;
  const elapsed = status === "upcoming" ? [] : eachDay(quest.startDate, lastDay);
  const inWindow = (date: string) => date >= quest.startDate && date <= lastDay;
  const amounts = new Map(logs.map((l) => [`${l.habitId}|${l.date}`, l.amount]));
  const amountOn = (habitId: number, date: string) => amounts.get(`${habitId}|${date}`) ?? 0;

  let cellSum = 0;
  const habits = quest.habits.map(({ habitId, dailyTarget }) => {
    const days = elapsed.map((date) => {
      const amount = amountOn(habitId, date);
      cellSum += Math.min(amount / dailyTarget, 1);
      return { date, met: amount >= dailyTarget };
    });
    return {
      habitId,
      total: logs.filter((l) => l.habitId === habitId && inWindow(l.date)).reduce((sum, l) => sum + l.amount, 0),
      daysMet: days.filter((d) => d.met).length,
      bestStreak: longestStreak(days),
    };
  });

  const cells = elapsed.length * quest.habits.length;
  const completionPct = cells === 0 ? 0 : (cellSum / cells) * 100;
  const scored = status === "upcoming" ? [] : scoreDays(buildTargetCalendar(allWindows, lastDay), logs);

  return {
    status,
    daysElapsed: elapsed.length,
    daysTotal: eachDay(quest.startDate, quest.endDate).length,
    completionPct,
    grade: cells === 0 ? null : grade(completionPct),
    xpEarned: totalXp(scored.filter((d) => inWindow(d.date))),
    habits,
  };
}
