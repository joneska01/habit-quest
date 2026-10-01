import "server-only";

import { computeGameState, type GameState } from "@/lib/game/score";

import { loadScoringData } from "./scoring";

/** Everything up to today, scored from scratch (nothing is stored — spec §4). */
export async function getGameState(userId: number, today: string): Promise<GameState> {
  const { windows, logs } = await loadScoringData(userId, today);
  return computeGameState(windows, logs, today);
}
