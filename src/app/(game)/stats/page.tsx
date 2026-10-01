import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { eachDay, endOfMonth, formatDayLabel, todayInChicago } from "@/lib/dates";
import { heatBin, yearSummary } from "@/lib/game/stats";
import { formatAmount, unitLabel } from "@/lib/logging";
import { listUserHabits } from "@/lib/queries/quests";
import { loadScoringData } from "@/lib/queries/scoring";

// One hue (grass), light → dark, for "how much of the day got done" (sequential scale).
const BIN_STYLE: Record<number, React.CSSProperties> = {
  [-1]: { background: "transparent", borderStyle: "dashed", opacity: 0.35 },
  0: { background: "var(--color-cloud)" },
  1: { background: "color-mix(in srgb, var(--color-grass) 25%, var(--color-cloud))" },
  2: { background: "color-mix(in srgb, var(--color-grass) 50%, var(--color-cloud))" },
  3: { background: "color-mix(in srgb, var(--color-grass) 75%, var(--color-cloud))" },
  4: { background: "var(--color-grass)" },
};
const LEGEND: [number, string][] = [
  [-1, "No quest"],
  [0, "0%"],
  [1, "<50%"],
  [2, "<80%"],
  [3, "<100%"],
  [4, "100%"],
];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const userId = await requireUser();
  const today = todayInChicago();
  const currentYear = Number(today.slice(0, 4));
  const requested = Number((await searchParams).year);
  const year = Number.isInteger(requested) && requested >= 2000 && requested <= currentYear ? requested : currentYear;

  const [{ windows, logs }, habits] = await Promise.all([loadScoringData(userId, today), listUserHabits(userId)]);
  const summary = yearSummary(windows, logs, year, today);
  const habitById = new Map(habits.map((h) => [h.id, h]));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <Link href={`/stats?year=${year - 1}`} className="pixel-btn bg-cloud" aria-label="Previous year">
          ◀
        </Link>
        <h1 className="font-pixel text-base text-cloud [text-shadow:3px_3px_0_var(--color-ink)]">{year} STATS</h1>
        {year < currentYear ? (
          <Link href={`/stats?year=${year + 1}`} className="pixel-btn bg-cloud" aria-label="Next year">
            ▶
          </Link>
        ) : (
          <span className="w-[52px]" aria-hidden />
        )}
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          ["XP", formatAmount(summary.xp)],
          ["PERFECT", String(summary.perfectDays)],
          ["DAYS", String(summary.activeDays)],
        ].map(([label, value]) => (
          <div key={label} className="pixel-card flex flex-col gap-2 p-3">
            <span className="font-pixel text-[10px]">{label}</span>
            <span className="font-pixel text-sm">{value}</span>
          </div>
        ))}
      </section>

      <section className="pixel-card flex flex-col gap-3 p-4">
        <h2 className="font-pixel text-xs">YEAR TOTALS</h2>
        {summary.habits.length === 0 && <p>No habits tracked in {year} yet.</p>}
        {summary.habits.map((s) => {
          const h = habitById.get(s.habitId);
          if (!h) return null;
          const total = h.unit === "check" ? `${s.daysMet} days` : `${formatAmount(s.total)} ${unitLabel(h.unit)}`;
          return (
            <div key={s.habitId} className="flex items-center gap-3 border-2 border-ink bg-cloud p-2">
              <span className="text-2xl" aria-hidden>
                {h.icon}
              </span>
              <div className="flex-1">
                <p className="font-bold">{h.name}</p>
                <p className="text-sm">Hit target {s.daysMet} days</p>
              </div>
              <span className="font-pixel text-xs">{total}</span>
            </div>
          );
        })}
      </section>

      <section className="pixel-card flex flex-col gap-4 p-4" aria-label={`${year} daily completion heatmap`}>
        <h2 className="font-pixel text-xs">DAILY HEATMAP</h2>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
          {LEGEND.map(([bin, label]) => (
            <li key={bin} className="flex items-center gap-1">
              <span className="inline-block size-3 border-2 border-ink" style={BIN_STYLE[bin]} />
              {label}
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {MONTHS.map((name, m) => {
            const first = `${year}-${String(m + 1).padStart(2, "0")}-01`;
            const offset = new Date(`${first}T00:00:00Z`).getUTCDay();
            return (
              <div key={name}>
                <p className="mb-1 font-pixel text-[10px]">{name}</p>
                <div className="grid grid-cols-7 gap-[2px]">
                  {Array.from({ length: offset }, (_, i) => (
                    <span key={`pad-${i}`} />
                  ))}
                  {eachDay(first, endOfMonth(first)).map((date) => {
                    const fraction = summary.completion.get(date);
                    const label =
                      fraction === undefined ? "no quest" : `${Math.round(fraction * 100)}% done`;
                    return (
                      <span
                        key={date}
                        className={`aspect-square border border-ink ${date === today ? "outline-2 outline-berry" : ""}`}
                        style={date > today ? { opacity: 0.15 } : BIN_STYLE[heatBin(fraction)]}
                        title={`${formatDayLabel(date)}: ${date > today ? "upcoming" : label}`}
                        aria-label={`${formatDayLabel(date)}: ${date > today ? "upcoming" : label}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
