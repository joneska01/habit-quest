import type { Nudge } from "@/lib/game/nudge";

import { dismissNudge } from "./actions";

export function NudgeBanner({ nudge, date }: { nudge: Nudge; date: string }) {
  return (
    <aside role="status" className="pixel-card flex items-start gap-3 bg-peach p-4">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center border-4 border-ink bg-coin font-pixel text-sm"
      >
        !
      </span>
      <div className="flex-1">
        <p className="font-pixel text-[10px] leading-relaxed">{nudge.title}</p>
        <p className="mt-1 text-sm font-bold">{nudge.body}</p>
      </div>
      <form action={dismissNudge.bind(null, date)}>
        <button type="submit" className="pixel-btn bg-cloud px-3 text-[10px]" aria-label="Dismiss reminder for today">
          ✕
        </button>
      </form>
    </aside>
  );
}
