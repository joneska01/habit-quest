"use client";

import { useState, useTransition } from "react";

import { formatRange, isIsoDate } from "@/lib/dates";
import { questEndDate, suggestQuestName } from "@/lib/quests";
import type { QuestPeriod } from "@/lib/types";

import { createQuest } from "../actions";
import { HabitPicker, useHabitPicks, type LibraryHabit } from "../habit-picker";

export function NewQuestForm({ library, today }: { library: LibraryHabit[]; today: string }) {
  const [period, setPeriod] = useState<QuestPeriod>("month");
  const [startDate, setStartDate] = useState(today);
  const [customName, setCustomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validStart = isIsoDate(startDate);
  const name = customName ?? (validStart ? suggestQuestName(period, startDate) : "");
  // Every habit (including ones added inline later) starts picked at its default target.
  const { pickFor, update, selected } = useHabitPicks(library, (h) => ({ on: true, target: String(h.defaultTarget) }));

  function submit() {
    setError(null);
    const habits = selected();
    startTransition(async () => {
      const result = await createQuest({ name, period, startDate, habits });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={submit} className="pixel-card flex flex-col gap-5 p-5">
      <fieldset className="flex gap-2">
        <legend className="mb-2 font-bold">Length</legend>
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={`pixel-btn flex-1 ${period === p ? "bg-grass" : "bg-cloud"}`}
          >
            {p === "week" ? "1 WEEK" : "MONTH"}
          </button>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 font-bold">
        Start date
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="pixel-input" />
      </label>
      {validStart && <p className="-mt-3 text-sm font-bold">📅 {formatRange(startDate, questEndDate(period, startDate))}</p>}

      <label className="flex flex-col gap-1 font-bold">
        Quest name
        <input value={name} onChange={(e) => setCustomName(e.target.value)} maxLength={60} required className="pixel-input" />
      </label>

      <HabitPicker library={library} pickFor={pickFor} update={update} />

      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="pixel-btn">
        {pending ? "STARTING..." : "▶ START QUEST"}
      </button>
    </form>
  );
}
