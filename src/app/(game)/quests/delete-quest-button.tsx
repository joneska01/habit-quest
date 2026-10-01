"use client";

import { deleteQuest } from "./actions";

export function DeleteQuestButton({ questId, name }: { questId: number; name: string }) {
  return (
    <form
      action={deleteQuest}
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? Your logged progress is kept.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="questId" value={questId} />
      <button type="submit" className="pixel-btn bg-cloud px-2 text-[10px]" aria-label={`Delete ${name}`}>
        🗑
      </button>
    </form>
  );
}
