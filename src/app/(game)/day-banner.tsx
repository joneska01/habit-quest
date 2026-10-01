"use client";

import { useState } from "react";

import { XP_PERFECT_DAY } from "@/lib/game/score";

export function DayBanner({ cleared, total }: { cleared: number; total: number }) {
  const perfect = total > 0 && cleared === total;
  const [seenPerfect, setSeenPerfect] = useState(perfect);
  const [celebrations, setCelebrations] = useState(0);
  if (perfect !== seenPerfect) {
    setSeenPerfect(perfect);
    if (perfect) setCelebrations((n) => n + 1);
  }

  return (
    <div className={`pixel-card relative px-4 py-2 text-center font-pixel text-xs ${perfect ? "bg-grass text-cloud" : "bg-coin"}`}>
      {perfect ? "★ PERFECT DAY ★" : `${cleared} / ${total} CLEARED`}
      {celebrations > 0 && (
        <span key={celebrations} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="anim-star-burst absolute text-4xl">✦</span>
          <span className="anim-coin-pop absolute -top-2 border-2 border-ink bg-coin px-2 py-1 text-[10px] text-ink">
            +{XP_PERFECT_DAY} XP
          </span>
        </span>
      )}
    </div>
  );
}
