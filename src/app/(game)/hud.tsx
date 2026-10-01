"use client";

import { useState } from "react";

import type { GameState } from "@/lib/game/score";

export function Hud({ xp, level, xpIntoLevel, xpForNextLevel, perfectStreak }: Omit<GameState, "habitStreaks">) {
  // Detect a level increase between server renders ("adjust state on prop change" pattern).
  const [seenLevel, setSeenLevel] = useState(level);
  const [levelUps, setLevelUps] = useState(0);
  if (level !== seenLevel) {
    setSeenLevel(level);
    if (level > seenLevel) setLevelUps((n) => n + 1);
  }

  const pct = Math.round((xpIntoLevel / xpForNextLevel) * 100);

  return (
    <section className="pixel-card relative flex flex-col gap-2 bg-cloud p-4" aria-label="Player status">
      <div className="flex items-center justify-between">
        <p className="font-pixel text-sm">LV {level}</p>
        <p className="font-pixel text-[10px]" title="Perfect-day streak">
          🔥 {perfectStreak} PERFECT
        </p>
      </div>
      <div
        className="xp-bar h-5 border-4 border-ink bg-cream"
        role="progressbar"
        aria-label="XP to next level"
        aria-valuemin={0}
        aria-valuemax={xpForNextLevel}
        aria-valuenow={xpIntoLevel}
      >
        <div className="h-full bg-coin transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm font-bold">
        {xpIntoLevel} / {xpForNextLevel} XP · {xp.toLocaleString("en-US")} total
      </p>
      {levelUps > 0 && (
        <div
          key={levelUps}
          role="status"
          className="anim-level-up pointer-events-none absolute inset-x-0 -top-5 mx-auto w-fit border-4 border-ink bg-berry px-4 py-2 font-pixel text-sm text-cloud shadow-[4px_4px_0_var(--color-ink)]"
        >
          LEVEL UP! ★ LV {level}
        </div>
      )}
    </section>
  );
}
