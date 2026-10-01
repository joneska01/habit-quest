"use client";

import { useState, useTransition } from "react";

import { formatRange, isIsoDate } from "@/lib/dates";
import { questEndDate, suggestQuestName } from "@/lib/quests";
import type { HabitUnit, QuestPeriod } from "@/lib/types";

import { createQuest } from "../actions";

type LibraryHabit = { id: number; name: string; unit: HabitUnit; defaultTarget: number; icon: string };
type HabitPick = { on: boolean; target: string };

export function NewQuestForm({ library, today }: { library: LibraryHabit[]; today: string }) {
  const [period, setPeriod] = useState<QuestPeriod>("month");
  const [startDate, setStartDate] = useState(today);
  const [customName, setCustomName] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<number, HabitPick>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validStart = isIsoDate(startDate);
  const name = customName ?? (validStart ? suggestQuestName(period, startDate) : "");
  // Habits added to the library after this form loaded default to picked too.
  const pickFor = (h: LibraryHabit): HabitPick => picks[h.id] ?? { on: true, target: String(h.defaultTarget) };
  const update = (h: LibraryHabit, change: Partial<HabitPick>) =>
    setPicks((prev) => ({ ...prev, [h.id]: { ...pickFor(h), ...change } }));

  function submit() {
    setError(null);
    const habits = library
      .filter((h) => pickFor(h).on)
      .map((h) => ({ habitId: h.id, dailyTarget: h.unit === "check" ? 1 : Number(pickFor(h).target) }));
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Habits &amp; daily targets</legend>
        {library.length === 0 && <p>Add a habit below to get started.</p>}
        {library.map((h) => {
          const pick = pickFor(h);
          return (
            <div key={h.id} className="flex items-center gap-3 border-2 border-ink bg-cloud p-2">
              <input
                type="checkbox"
                checked={pick.on}
                onChange={(e) => update(h, { on: e.target.checked })}
                aria-label={`Include ${h.name}`}
                className="size-6 accent-grass"
              />
              <span className="flex-1 font-bold">
                {h.icon} {h.name}
              </span>
              {h.unit === "check" ? (
                <span className="text-sm font-bold">daily ✓</span>
              ) : (
                <label className="flex items-center gap-1 text-sm font-bold">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={pick.target}
                    disabled={!pick.on}
                    onChange={(e) => update(h, { target: e.target.value })}
                    aria-label={`${h.name} daily target`}
                    className="w-24 border-2 border-ink px-2 py-1"
                  />
                  {h.unit === "minutes" ? "min" : ""}
                </label>
              )}
            </div>
          );
        })}
      </fieldset>

      {error && (
        <p role="alert" className="font-bold text-brick">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="pixel-btn">
        {pending ? "STARTING..." : "▶ START QUEST"}
      </button>
    </form>
  );
}
