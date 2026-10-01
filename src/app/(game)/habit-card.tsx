"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";

import { XP_PER_HABIT } from "@/lib/game/score";
import type { DayHabit } from "@/lib/game/targets";
import { formatAmount, progressFraction, quickAddAmounts, unitLabel } from "@/lib/logging";
import { colorVar } from "@/lib/palette";

import { logProgress } from "./actions";

type Change = { mode: "add" | "set"; amount: number };
/** What to send to reverse a change. Undo of a quick-add is "add −n" so rapid taps stay correct. */
type UndoEntry = { id: number; label: string; inverse: Change };

const SEGMENTS = 10;

export function HabitCard({ habit, date, streak }: { habit: DayHabit; date: string; streak: number }) {
  const [amount, applyOptimistic] = useOptimistic(habit.amount, (current: number, change: Change) =>
    change.mode === "add" ? Math.max(0, current + change.amount) : change.amount,
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  // Undo history lives for this page visit only; after a reload, SET is the way to correct.
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const nextUndoId = useRef(0);

  const unit = unitLabel(habit.unit);
  const fraction = progressFraction(amount, habit.target);
  const cleared = amount >= habit.target;
  const filled = Math.floor(fraction * SEGMENTS);

  // Pop a "+10 XP" coin when this habit flips to cleared (not on first render).
  const [seenCleared, setSeenCleared] = useState(cleared);
  const [coinPops, setCoinPops] = useState(0);
  if (cleared !== seenCleared) {
    setSeenCleared(cleared);
    if (cleared) setCoinPops((n) => n + 1);
  }

  /** Pass `undoLabel` for user actions that should be undoable; omit it when replaying an undo. */
  function submit(change: Change, undoLabel?: string) {
    setError(null);
    let undoId: number | undefined;
    if (undoLabel) {
      undoId = ++nextUndoId.current;
      const inverse: Change =
        change.mode === "add" ? { mode: "add", amount: -change.amount } : { mode: "set", amount };
      setUndoStack((stack) => [...stack, { id: undoId!, label: undoLabel, inverse }]);
    }
    startTransition(async () => {
      applyOptimistic(change);
      const result = await logProgress({ habitId: habit.habitId, date, ...change });
      if ("error" in result) {
        setError(result.error);
        if (undoId) setUndoStack((stack) => stack.filter((e) => e.id !== undoId));
      }
    });
  }

  function undo() {
    const last = undoStack.at(-1);
    if (!last) return;
    setUndoStack((stack) => stack.slice(0, -1));
    submit(last.inverse);
  }

  function onSet(formData: FormData) {
    const value = Number(formData.get("amount"));
    if (!Number.isInteger(value) || value < 0) {
      setError("Enter a whole number, 0 or more.");
      return;
    }
    setEditing(false);
    if (value !== amount) submit({ mode: "set", amount: value }, "SET");
  }

  return (
    <article
      className={`pixel-card relative flex flex-col gap-3 p-4 ${cleared ? "outline-4 outline-offset-2 outline-coin" : ""}`}
      style={{ "--habit": colorVar(habit.color) } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {habit.icon}
        </span>
        <div className="flex-1">
          <h2 className="font-pixel text-xs leading-relaxed">
            {habit.name.toUpperCase()}
            {streak > 0 && (
              <span className="ml-2 font-body text-sm font-bold" title={`${streak}-day streak`}>
                🔥{streak}
              </span>
            )}
          </h2>
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
              onClick={() => submit({ mode: "add", amount: step }, `+${formatAmount(step)}`)}
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

      {undoStack.length > 0 && habit.unit !== "check" && (
        <button
          type="button"
          onClick={undo}
          className="pixel-btn w-full border-dashed bg-cloud text-[10px] shadow-none"
          aria-label={`Undo ${undoStack.at(-1)!.label} on ${habit.name}`}
        >
          ↶ UNDO {undoStack.at(-1)!.label}
          {undoStack.length > 1 && <span className="ml-2 opacity-70">({undoStack.length})</span>}
        </button>
      )}

      {coinPops > 0 && (
        <span
          key={coinPops}
          className="anim-coin-pop pointer-events-none absolute top-2 right-4 border-2 border-ink bg-coin px-2 py-1 font-pixel text-[10px]"
          aria-hidden
        >
          🪙 +{XP_PER_HABIT} XP
        </span>
      )}

      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
    </article>
  );
}
