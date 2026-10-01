import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { formatRange, todayInChicago } from "@/lib/dates";
import { questReport } from "@/lib/game/report";
import { GRADE_BG } from "@/lib/grade-style";
import { formatAmount, unitLabel } from "@/lib/logging";
import { getQuest } from "@/lib/queries/quests";
import { loadScoringData } from "@/lib/queries/scoring";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const quest = await getQuest(userId, Number((await params).id));
  if (!quest) notFound();

  const today = todayInChicago();
  const { windows, logs } = await loadScoringData(userId, today);
  const report = questReport(quest, windows, logs, today);
  const done = report.status === "completed";

  return (
    <div className="flex flex-col gap-5">
      <section className="pixel-card flex flex-col items-center gap-4 p-6 text-center">
        <p className="font-pixel text-xs leading-relaxed">{done ? "★ QUEST CLEAR ★" : "QUEST IN PROGRESS"}</p>
        <h1 className="font-pixel text-sm leading-relaxed">{quest.name.toUpperCase()}</h1>
        <p className="text-sm font-bold">{formatRange(quest.startDate, quest.endDate)}</p>
        {report.grade ? (
          <>
            <div className={`border-4 border-ink px-8 py-6 font-pixel text-5xl shadow-[6px_6px_0_var(--color-ink)] ${GRADE_BG[report.grade]}`}>
              {report.grade}
            </div>
            <p className="font-pixel text-xs">RANK</p>
          </>
        ) : (
          <p className="font-bold">This quest hasn&apos;t started yet.</p>
        )}
        {!done && report.grade && (
          <p className="text-sm font-bold">
            Preview after day {report.daysElapsed} of {report.daysTotal}. Keep going!
          </p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          ["COMPLETE", `${Math.round(report.completionPct)}%`],
          ["XP", formatAmount(report.xpEarned)],
          ["DAYS", `${report.daysElapsed}/${report.daysTotal}`],
        ].map(([label, value]) => (
          <div key={label} className="pixel-card flex flex-col gap-2 p-3">
            <span className="font-pixel text-[10px]">{label}</span>
            <span className="font-pixel text-sm">{value}</span>
          </div>
        ))}
      </section>

      <section className="pixel-card flex flex-col gap-3 p-4">
        <h2 className="font-pixel text-xs">HABIT TOTALS</h2>
        {quest.habits.map((h) => {
          const r = report.habits.find((x) => x.habitId === h.habitId)!;
          const total = h.unit === "check" ? `${r.daysMet} days` : `${formatAmount(r.total)} ${unitLabel(h.unit)}`;
          return (
            <div key={h.habitId} className="flex items-center gap-3 border-2 border-ink bg-cloud p-2">
              <span className="text-2xl" aria-hidden>
                {h.icon}
              </span>
              <div className="flex-1">
                <p className="font-bold">{h.name}</p>
                <p className="text-sm">
                  Hit target {r.daysMet}/{report.daysElapsed} days · best 🔥{r.bestStreak}
                </p>
              </div>
              <span className="font-pixel text-xs">{total}</span>
            </div>
          );
        })}
      </section>

      <Link href={`/quests/${quest.id}`} className="pixel-btn bg-cloud text-center">
        ◀ QUEST CALENDAR
      </Link>
    </div>
  );
}
