import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatRange, todayInChicago } from "@/lib/dates";
import { formatAmount, unitLabel } from "@/lib/logging";
import { listQuests, type QuestSummary } from "@/lib/queries/quests";
import { questStatus, type QuestStatus } from "@/lib/quests";

import { DeleteQuestButton } from "./delete-quest-button";

const SECTIONS: { status: QuestStatus; title: string; color: string }[] = [
  { status: "active", title: "ACTIVE", color: "bg-grass" },
  { status: "upcoming", title: "UPCOMING", color: "bg-ocean" },
  { status: "completed", title: "COMPLETED", color: "bg-grape" },
];

function QuestCard({ quest }: { quest: QuestSummary }) {
  return (
    <article className="pixel-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h3 className="font-pixel text-xs leading-relaxed">
            <Link href={`/quests/${quest.id}`} className="underline decoration-2 underline-offset-4">
              {quest.name.toUpperCase()} ▶
            </Link>
          </h3>
          <p className="font-bold">
            {formatRange(quest.startDate, quest.endDate)} · {quest.period === "week" ? "Weekly" : "Monthly"}
          </p>
        </div>
        <Link
          href={`/quests/${quest.id}/edit`}
          className="pixel-btn bg-cloud px-2 text-[10px]"
          aria-label={`Edit habits in ${quest.name}`}
        >
          ✏️
        </Link>
        <DeleteQuestButton questId={quest.id} name={quest.name} />
      </div>
      <ul className="flex flex-wrap gap-2">
        {quest.habits.map((h) => (
          <li key={h.habitId} className="border-2 border-ink bg-cloud px-2 py-1 text-sm font-bold">
            {h.icon} {h.name} {h.unit === "check" ? "✓" : `${formatAmount(h.dailyTarget)} ${unitLabel(h.unit)}`}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default async function QuestsPage() {
  const userId = await requireUser();
  const today = todayInChicago();
  const allQuests = await listQuests(userId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-base text-cloud [text-shadow:3px_3px_0_var(--color-ink)]">QUEST LOG</h1>
        <Link href="/quests/new" className="pixel-btn">
          + NEW
        </Link>
      </div>

      {SECTIONS.map(({ status, title, color }) => {
        const list = allQuests.filter((q) => questStatus(q, today) === status);
        if (list.length === 0) return null;
        return (
          <section key={status} className="flex flex-col gap-3">
            <h2 className={`self-start border-4 border-ink px-3 py-1 font-pixel text-[10px] text-cloud ${color}`}>
              {title}
            </h2>
            {list.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </section>
        );
      })}

      {allQuests.length === 0 && (
        <p className="pixel-card p-6 text-center">No quests yet. Start one! 🍄</p>
      )}
    </div>
  );
}
