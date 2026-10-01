import { addDays, endOfMonth } from "./dates";
import type { QuestPeriod } from "./types";

export type QuestStatus = "upcoming" | "active" | "completed";

const monthYear = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

export function questEndDate(period: QuestPeriod, startDate: string): string {
  return period === "week" ? addDays(startDate, 6) : endOfMonth(startDate);
}

export function suggestQuestName(period: QuestPeriod, startDate: string): string {
  const d = new Date(`${startDate}T00:00:00Z`);
  return period === "month" ? monthYear.format(d) : `Week of ${monthDay.format(d)}`;
}

export function questStatus(quest: { startDate: string; endDate: string }, today: string): QuestStatus {
  if (today < quest.startDate) return "upcoming";
  if (today > quest.endDate) return "completed";
  return "active";
}
