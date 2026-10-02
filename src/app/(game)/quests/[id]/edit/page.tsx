import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { formatRange, todayInChicago } from "@/lib/dates";
import { listLibraryHabits, getQuest } from "@/lib/queries/quests";
import { questStatus } from "@/lib/quests";

import { NewHabitForm } from "../../new/new-habit-form";
import { EditQuestForm } from "./edit-quest-form";

export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const quest = await getQuest(userId, Number((await params).id));
  if (!quest) notFound();
  const library = await listLibraryHabits(userId);
  const started = questStatus(quest, todayInChicago()) !== "upcoming";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-pixel text-base leading-relaxed text-cloud [text-shadow:3px_3px_0_var(--color-ink)]">
          EDIT HABITS
        </h1>
        <p className="mt-1 font-bold">
          {quest.name} · {formatRange(quest.startDate, quest.endDate)}
        </p>
      </div>
      <EditQuestForm
        questId={quest.id}
        started={started}
        current={quest.habits.map((h) => ({ habitId: h.habitId, dailyTarget: h.dailyTarget }))}
        library={library}
      />
      <NewHabitForm />
    </div>
  );
}
