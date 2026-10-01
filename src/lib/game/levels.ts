/** XP needed to go from `level` to `level + 1`: 100, 125, 150, … (spec §4). */
export function levelCost(level: number): number {
  return 100 + 25 * (level - 1);
}

export type LevelInfo = { level: number; xpIntoLevel: number; xpForNextLevel: number };

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  while (remaining >= levelCost(level)) {
    remaining -= levelCost(level);
    level++;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: levelCost(level) };
}
