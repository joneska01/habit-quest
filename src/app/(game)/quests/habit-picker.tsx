"use client";

import { useState } from "react";

import type { HabitUnit } from "@/lib/types";

export type LibraryHabit = { id: number; name: string; unit: HabitUnit; defaultTarget: number; icon: string };
export type HabitPick = { on: boolean; target: string };

/**
 * Checkbox + target state for a habit list. `initialFor` sets each habit's starting pick;
 * habits added to the library later (via the inline New Habit form) use it too.
 */
export function useHabitPicks(library: LibraryHabit[], initialFor: (h: LibraryHabit) => HabitPick) {
  const [picks, setPicks] = useState<Record<number, HabitPick>>({});
  const pickFor = (h: LibraryHabit): HabitPick => picks[h.id] ?? initialFor(h);
  const update = (h: LibraryHabit, change: Partial<HabitPick>) =>
    setPicks((prev) => ({ ...prev, [h.id]: { ...pickFor(h), ...change } }));
  const selected = () =>
    library
      .filter((h) => pickFor(h).on)
      .map((h) => ({ habitId: h.id, dailyTarget: h.unit === "check" ? 1 : Number(pickFor(h).target) }));
  return { pickFor, update, selected };
}

export function HabitPicker({
  library,
  pickFor,
  update,
}: {
  library: LibraryHabit[];
  pickFor: (h: LibraryHabit) => HabitPick;
  update: (h: LibraryHabit, change: Partial<HabitPick>) => void;
}) {
  return (
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
  );
}
