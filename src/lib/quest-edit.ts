// Pure diff of a quest's habit list, used to confirm edits on a quest already in progress.
export type HabitTarget = { habitId: number; dailyTarget: number };
export type QuestHabitDiff = {
  added: number[];
  removed: number[];
  retargeted: { habitId: number; from: number; to: number }[];
};

export function diffQuestHabits(current: HabitTarget[], next: HabitTarget[]): QuestHabitDiff {
  const before = new Map(current.map((h) => [h.habitId, h.dailyTarget]));
  const after = new Map(next.map((h) => [h.habitId, h.dailyTarget]));
  return {
    added: [...after.keys()].filter((id) => !before.has(id)),
    removed: [...before.keys()].filter((id) => !after.has(id)),
    retargeted: [...after.entries()]
      .filter(([id, to]) => before.has(id) && before.get(id) !== to)
      .map(([habitId, to]) => ({ habitId, from: before.get(habitId)!, to })),
  };
}

export function hasChanges(diff: QuestHabitDiff): boolean {
  return diff.added.length + diff.removed.length + diff.retargeted.length > 0;
}
