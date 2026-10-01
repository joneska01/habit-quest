import type { HabitUnit } from "./types";

/** Round to a "friendly" button size: 1, 2, 2.5, 5 × 10ⁿ (2.5 only when it stays a whole number). */
export function niceRound(value: number): number {
  if (value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = magnitude >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  const candidates = steps.map((s) => s * magnitude);
  return candidates.reduce((best, c) => (Math.abs(c - value) < Math.abs(best - value) ? c : best));
}

/** Quick-add button amounts: ~10%, 25% and 50% of the daily target. */
export function quickAddAmounts(target: number): number[] {
  return [...new Set([0.1, 0.25, 0.5].map((pct) => niceRound(target * pct)))];
}

export function progressFraction(amount: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(amount / target, 1);
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US");
}

export function unitLabel(unit: HabitUnit): string {
  return unit === "minutes" ? "min" : "";
}
