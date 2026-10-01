// Habit colors map to the @theme tokens in globals.css.
export const HABIT_COLORS = ["brick", "berry", "grape", "ocean", "grass", "coin", "lime", "peach", "sky"] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export function colorVar(color: string): string {
  return `var(--color-${color})`;
}

export const HABIT_ICONS = ["🦵", "💪", "🌀", "👟", "📚", "💧", "🧘", "🚴", "🏃", "🥗", "😴", "🎸", "✍️", "🧠", "🍎", "⭐"] as const;
