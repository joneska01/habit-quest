"use client";

import { useActionState, useState } from "react";

import { colorVar, HABIT_COLORS, HABIT_ICONS } from "@/lib/palette";
import { HABIT_UNITS, type HabitUnit } from "@/lib/types";

import { createHabit, type FormState } from "../actions";

const UNIT_LABELS: Record<HabitUnit, string> = { count: "COUNT", minutes: "MINUTES", check: "CHECK" };

export function NewHabitForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createHabit, {});
  const [unit, setUnit] = useState<HabitUnit>("count");

  return (
    <details className="pixel-card p-5" open={!!state.error}>
      <summary className="cursor-pointer font-pixel text-xs">+ ADD A NEW HABIT</summary>
      {/* Remount after each successful create so the fields reset. */}
      <form key={state.createdAt ?? 0} action={formAction} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-bold">
          Name
          <input name="name" maxLength={40} required placeholder="e.g. Drink water" className="pixel-input" />
        </label>

        <fieldset className="flex gap-2">
          <legend className="mb-2 font-bold">Track it as</legend>
          {HABIT_UNITS.map((u) => (
            <label key={u} className={`pixel-btn flex-1 px-1 text-center text-[10px] ${unit === u ? "bg-grass" : "bg-cloud"}`}>
              <input
                type="radio"
                name="unit"
                value={u}
                checked={unit === u}
                onChange={() => setUnit(u)}
                className="sr-only"
              />
              {UNIT_LABELS[u]}
            </label>
          ))}
        </fieldset>

        {unit !== "check" && (
          <label className="flex flex-col gap-1 font-bold">
            Default daily target {unit === "minutes" ? "(minutes)" : ""}
            <input name="defaultTarget" type="number" inputMode="numeric" min={1} required className="pixel-input" />
          </label>
        )}

        <fieldset>
          <legend className="mb-2 font-bold">Icon</legend>
          <div className="grid grid-cols-8 gap-1">
            {HABIT_ICONS.map((icon, i) => (
              <label key={icon} className="cursor-pointer">
                <input type="radio" name="icon" value={icon} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex aspect-square items-center justify-center border-2 border-ink bg-cloud text-xl peer-checked:bg-coin">
                  {icon}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-bold">Color</legend>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((color, i) => (
              <label key={color} className="cursor-pointer" title={color}>
                <input type="radio" name="color" value={color} defaultChecked={i === 0} className="peer sr-only" />
                <span
                  className="block size-9 border-4 border-ink peer-checked:outline-4 peer-checked:outline-offset-2 peer-checked:outline-ink"
                  style={{ background: colorVar(color) }}
                />
              </label>
            ))}
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="font-bold text-danger">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="pixel-btn bg-grass">
          {pending ? "SAVING..." : "SAVE HABIT"}
        </button>
      </form>
    </details>
  );
}
