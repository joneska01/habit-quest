import { requireUser } from "@/lib/auth/session";
import { todayInChicago } from "@/lib/dates";
import { listLibraryHabits } from "@/lib/queries/quests";

import { NewHabitForm } from "./new-habit-form";
import { NewQuestForm } from "./new-quest-form";

export default async function NewQuestPage() {
  const userId = await requireUser();
  const library = await listLibraryHabits(userId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base text-cloud [text-shadow:3px_3px_0_var(--color-ink)]">NEW QUEST</h1>
      <NewQuestForm library={library} today={todayInChicago()} />
      <NewHabitForm />
    </div>
  );
}
