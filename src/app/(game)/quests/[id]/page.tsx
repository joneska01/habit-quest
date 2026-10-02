import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { eachDay, formatDayLabel, formatRange, todayInChicago } from "@/lib/dates";
import { questReport } from "@/lib/game/report";
import { GRADE_BG } from "@/lib/grade-style";
import { formatAmount, unitLabel } from "@/lib/logging";
import { colorVar } from "@/lib/palette";
import { getQuest } from "@/lib/queries/quests";
import { loadScoringData } from "@/lib/queries/scoring";

/** Cell fill: solid habit color when met, a lighter mix for partial, white for nothing. */
function cellBackground(fraction: number): string {
  if (fraction >= 1) return "var(--habit)";
  if (fraction <= 0) return "var(--color-cloud)";
  return `color-mix(in srgb, var(--habit) ${Math.round(20 + fraction * 50)}%, var(--color-cloud))`;
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const quest = await getQuest(userId, Number((await params).id));
  if (!quest) notFound();

  const today = todayInChicago();
  const { windows, logs } = await loadScoringData(userId, today);
  const report = questReport(quest, windows, logs, today);
  const amounts = new Map(logs.map((l) => [`${l.habitId}|${l.date}`, l.amount]));
  const columns = { gridTemplateColumns: `5.5rem repeat(${quest.habits.length}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col gap-5">
      <section className="pixel-card flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-pixel text-sm leading-relaxed">{quest.name.toUpperCase()}</h1>
          <Link href={`/quests/${quest.id}/edit`} className="pixel-btn shrink-0 bg-cloud px-2 text-[10px]">
            ✏️ EDIT
          </Link>
        </div>
        <p className="font-bold">
          {formatRange(quest.startDate, quest.endDate)} · {quest.period === "week" ? "Weekly" : "Monthly"}
        </p>
        {report.grade ? (
          <div className="flex items-center gap-3">
            <span className={`border-4 border-ink px-3 py-2 font-pixel text-lg ${GRADE_BG[report.grade]}`}>
              {report.grade}
            </span>
            <p className="flex-1 text-sm font-bold">
              {Math.round(report.completionPct)}% complete · day {report.daysElapsed} of {report.daysTotal}
              <br />
              {formatAmount(report.xpEarned)} XP earned
            </p>
            <Link href={`/quests/${quest.id}/results`} className="pixel-btn px-2 text-[10px]">
              RESULTS ▶
            </Link>
          </div>
        ) : (
          <p className="font-bold">Starts {formatDayLabel(quest.startDate)}. Get ready! 🍄</p>
        )}
      </section>

      <section className="pixel-card p-3" aria-label="Quest calendar">
        <div className="grid items-end gap-1 pb-2" style={columns}>
          <span className="text-xs font-bold">Tap a day</span>
          {quest.habits.map((h) => (
            <span key={h.habitId} className="text-center text-xl" title={h.name} aria-label={h.name}>
              {h.icon}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {eachDay(quest.startDate, quest.endDate).map((date) => {
            const future = date > today;
            const cells = quest.habits.map((h) => {
              const amount = amounts.get(`${h.habitId}|${date}`) ?? 0;
              return { ...h, amount, fraction: Math.min(amount / h.dailyTarget, 1) };
            });
            const cleared = cells.filter((c) => c.fraction >= 1).length;
            const rowClass = `grid items-center gap-1 ${date === today ? "outline-4 outline-coin" : ""}`;
            const content = (
              <>
                <span className="text-xs font-bold">{formatDayLabel(date)}</span>
                {cells.map((c) => (
                  <span
                    key={c.habitId}
                    className={`flex h-8 items-center justify-center border-2 border-ink text-xs font-bold ${future ? "border-dashed opacity-40" : ""}`}
                    style={{
                      "--habit": colorVar(c.color),
                      background: future ? "transparent" : cellBackground(c.fraction),
                    } as React.CSSProperties}
                    title={`${c.name}: ${formatAmount(c.amount)} / ${formatAmount(c.dailyTarget)} ${unitLabel(c.unit)}`}
                  >
                    {!future && c.fraction >= 1 ? "★" : ""}
                  </span>
                ))}
              </>
            );
            return future ? (
              <div key={date} className={rowClass} style={columns} aria-label={`${formatDayLabel(date)}, upcoming`}>
                {content}
              </div>
            ) : (
              <Link
                key={date}
                href={date === today ? "/" : `/?date=${date}`}
                className={`${rowClass} hover:bg-coin/30`}
                style={columns}
                aria-label={`${formatDayLabel(date)}: ${cleared} of ${cells.length} cleared. Open to log.`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
