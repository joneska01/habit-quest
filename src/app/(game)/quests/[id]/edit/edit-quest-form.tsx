"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { formatAmount } from "@/lib/logging";
import { diffQuestHabits, hasChanges, type HabitTarget, type QuestHabitDiff } from "@/lib/quest-edit";

import { updateQuestHabits } from "../../actions";
import { HabitPicker, useHabitPicks, type LibraryHabit } from "../../habit-picker";

type Props = { questId: number; started: boolean; current: HabitTarget[]; library: LibraryHabit[] };

export function EditQuestForm({ questId, started, current, library }: Props) {
  const inQuest = new Map(current.map((h) => [h.habitId, h.dailyTarget]));
  // Habits created inline on this page start picked (that's why you'd create one here).
  const [originalLibrary] = useState(() => new Set(library.map((h) => h.id)));
  const { pickFor, update, selected } = useHabitPicks(library, (h) =>
    inQuest.has(h.id)
      ? { on: true, target: String(inQuest.get(h.id)) }
      : { on: !originalLibrary.has(h.id), target: String(h.defaultTarget) },
  );

  const [diff, setDiff] = useState<QuestHabitDiff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const byId = new Map(library.map((h) => [h.id, h]));
  const label = (id: number) => (byId.get(id) ? `${byId.get(id)!.icon} ${byId.get(id)!.name}` : `Habit #${id}`);

  function save() {
    startTransition(async () => {
      const result = await updateQuestHabits({ questId, habits: selected() });
      if (result?.error) {
        dialog.current?.close();
        setError(result.error);
      }
    });
  }

  function onSubmit() {
    setError(null);
    const next = selected();
    if (next.length === 0) return setError("A quest needs at least one habit.");
    const changes = diffQuestHabits(current, next);
    if (!hasChanges(changes)) return setError("No changes to save.");
    if (!started) return save();
    // Quest already underway: confirm, because past days get re-scored.
    setDiff(changes);
    dialog.current?.showModal();
  }

  return (
    <>
      <form action={onSubmit} className="pixel-card flex flex-col gap-5 p-5">
        <HabitPicker library={library} pickFor={pickFor} update={update} />
        {error && (
          <p role="alert" className="font-bold text-danger">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/quests/${questId}`} className="pixel-btn bg-cloud text-center">
            CANCEL
          </Link>
          <button type="submit" disabled={pending} className="pixel-btn bg-grass">
            {pending ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </form>

      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        className="pixel-card m-auto w-[min(92vw,26rem)] p-5 backdrop:bg-ink/60"
      >
        <h2 id="confirm-title" className="font-pixel text-xs leading-relaxed">
          ⚠ CHANGE A QUEST IN PROGRESS?
        </h2>
        {diff && (
          <ul className="my-4 flex flex-col gap-1 text-sm font-bold">
            {diff.added.map((id) => (
              <li key={`a${id}`}>➕ Add {label(id)}</li>
            ))}
            {diff.removed.map((id) => (
              <li key={`r${id}`}>➖ Remove {label(id)}</li>
            ))}
            {diff.retargeted.map((r) => (
              <li key={`t${r.habitId}`}>
                🎯 {label(r.habitId)}: {formatAmount(r.from)} → {formatAmount(r.to)}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          <strong>Every day of this quest gets re-scored</strong> with the new list, including days already played. XP,
          streaks, perfect days and the grade may change. Your logged amounts are always kept.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" autoFocus onClick={() => dialog.current?.close()} className="pixel-btn bg-cloud">
            CANCEL
          </button>
          <button type="button" disabled={pending} onClick={save} className="pixel-btn bg-brick text-cloud">
            {pending ? "SAVING..." : "YES, UPDATE"}
          </button>
        </div>
      </dialog>
    </>
  );
}
