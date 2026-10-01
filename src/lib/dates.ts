// All app dates are plain "YYYY-MM-DD" strings. Arithmetic goes through UTC so a
// time zone can never shift a day; "today" is always Katie's Central time.

const TIME_ZONE = "America/Chicago";

const isoInZone = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hourInZone = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });

const dayLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const shortDate = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayInChicago(now: Date = new Date()): string {
  return isoInZone.format(now);
}

/** Current hour (0–23) in Central time. */
export function hourInChicago(now: Date = new Date()): number {
  return Number(hourInZone.format(now));
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Inclusive list of dates from start to end (empty if end < start). */
export function eachDay(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export function endOfMonth(date: string): string {
  const d = toUtc(date);
  // Day 0 of next month = last day of this month.
  return fromUtc(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = toUtc(value);
  return !Number.isNaN(d.getTime()) && fromUtc(d) === value;
}

export function formatDayLabel(date: string): string {
  return dayLabel.format(toUtc(date));
}

export function formatRange(start: string, end: string): string {
  return `${shortDate.format(toUtc(start))} – ${shortDate.format(toUtc(end))}`;
}
