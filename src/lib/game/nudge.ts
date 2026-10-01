// Evening nudge (nudges-scope.md): one message, only when today is unfinished.
// Shared by the in-app banner and (later) the 7 pm push.
import { formatAmount, unitLabel } from "../logging";
import { XP_PER_HABIT, XP_PERFECT_DAY } from "./score";
import type { DayHabit } from "./targets";

/** Banner appears from 5 pm Central. */
export const NUDGE_HOUR = 17;
const MAX_LISTED = 3;

export type Nudge = { title: string; body: string };

type NudgeInput = {
  dayHabits: DayHabit[];
  /** Perfect days in a row before today (an unfinished today doesn't count against it). */
  perfectStreak: number;
  habitStreaks: Record<number, number>;
  /** Current Central hour, 0–23. */
  hour: number;
};

function describe(h: DayHabit): string {
  if (h.unit === "check") return h.name;
  return `${h.name} ${formatAmount(h.amount)}/${formatAmount(h.target)}${h.unit === "minutes" ? ` ${unitLabel(h.unit)}` : ""}`;
}

export function nudgeFor({ dayHabits, perfectStreak, habitStreaks, hour }: NudgeInput): Nudge | null {
  if (hour < NUDGE_HOUR) return null;
  const left = dayHabits.filter((h) => h.amount < h.target);
  if (left.length === 0) return null;

  const atRisk = left
    .map((h) => ({ name: h.name, streak: habitStreaks[h.habitId] ?? 0 }))
    .sort((a, b) => b.streak - a.streak)[0];

  let title: string;
  if (perfectStreak > 0) title = `🔥 ${perfectStreak}-day perfect streak on the line!`;
  else if (atRisk.streak >= 2) title = `🔥 ${atRisk.name}'s ${atRisk.streak}-day streak is on the line!`;
  else if (dayHabits.every((h) => h.amount === 0)) title = "Nothing logged yet today";
  else title = `${left.length} habit${left.length === 1 ? "" : "s"} left today`;

  const listed = left.slice(0, MAX_LISTED).map(describe).join(", ");
  const more = left.length > MAX_LISTED ? ` +${left.length - MAX_LISTED} more` : "";
  const xp = left.length * XP_PER_HABIT + XP_PERFECT_DAY;

  return { title, body: `${left.length} left: ${listed}${more}. +${xp} XP up for grabs.` };
}
