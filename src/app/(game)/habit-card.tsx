"use client";

import { useOptimistic, useState, useTransition } from "react";

import type { DayHabit } from "@/lib/game/targets";
import { formatAmount, progressFraction, quickAddAmounts, unitLabel } from "@/lib/logging";
import { colorVar } from "@/lib/palette";

import { logProgress } from "./actions";

type Change = { mode: "add" | "set"; amount: number };

const SEGMENTS = 10;

export function HabitCard({ habit, date }: { habit: DayHabit; date: string }) {
  const [amount, applyOptimistic] = useOptimistic(habit.amount, (current: number, change: Change) =>
    change.mode === "add" ? current + change.amount : change.amount,
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const unit = unitLabel(habit.unit);
  const fraction = progressFraction(amount, habit.target);
  const cleared = amount >= habit.target;
  const filled = Math.floor(fraction * SEGMENTS);

  function submit(change: Change) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(change);
      const result = await logProgress({ habitId: habit.habitId, date, ...change });
      if ("error" in result) setError(result.error);
    });
  }

  function onSet(formData: FormData) {
    const value = Number(formData.get("amount"));
    if (!Number.isInteger(value) || value < 0) {
      setError("Enter a whole number, 0 or more.");
      return;
    }
    setEditing(false);
    submit({ mode: "set", amount: value });
  }

  return (
    <article
      className={`pixel-card flex flex-col gap-3 p-4 ${cleared ? "outline-4 outline-offset-2 outline-coin" : ""}`}
      style={{ "--habit": colorVar(habit.color) } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {habit.icon}
        </span>
        <div className="flex-1">
          <h2 className="font-pixel text-xs leading-relaxed">{habit.name.toUpperCase()}</h2>
          {habit.unit !== "check" && (
            <p className="font-bold">
              {formatAmount(amount)} / {formatAmount(habit.target)} {unit}
            </p>
          )}
        </div>
        {cleared && (
          <span className="border-2 border-ink bg-coin px-2 py-1 font-pixel text-[10px]">⭐ CLEAR!</span>
        )}
      </div>

      {habit.unit !== "check" && (
        <div
          className="flex gap-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={habit.target}
          aria-valuenow={amount}
          aria-label={`${habit.name} progress`}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className="h-4 flex-1 border-2 border-ink"
              style={{ background: i < filled ? "var(--habit)" : "var(--color-cloud)" }}
            />
          ))}
        </div>
      )}

      {habit.unit === "check" ? (
        <button
          type="button"
          className="pixel-btn w-full"
          style={{ background: cleared ? "var(--habit)" : undefined }}
          onClick={() => submit({ mode: "set", amount: cleared ? 0 : 1 })}
        >
          {cleared ? "DONE ✓" : "MARK DONE"}
        </button>
      ) : editing ? (
        <form action={onSet} className="flex gap-2">
          <input
            name="amount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={amount}
            autoFocus
            aria-label={`Set ${habit.name} total`}
            className="pixel-input flex-1"
          />
          <button type="submit" className="pixel-btn bg-grass">
            SAVE
          </button>
          <button type="button" className="pixel-btn bg-cloud" onClick={() => setEditing(false)} aria-label="Cancel">
            ✕
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {quickAddAmounts(habit.target).map((step) => (
            <button
              key={step}
              type="button"
              className="pixel-btn min-w-0 bg-cloud px-0 text-[10px]"
              onClick={() => submit({ mode: "add", amount: step })}
            >
              +{formatAmount(step)}
            </button>
          ))}
          <button
            type="button"
            className="pixel-btn col-start-4 min-w-0 px-0 text-[10px]"
            onClick={() => setEditing(true)}
          >
            SET
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="font-bold text-brick">
          {error}
        </p>
      )}
    </article>
  );
}
