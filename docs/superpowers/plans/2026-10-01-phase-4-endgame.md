# Habit Quest — Phase 4: Endgame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A quest calendar for jumping to any day, a "level clear" results screen with a grade, a year stats page with a heatmap, plus two of Katie's requests: an **undo button** for quick-adds and **auto-submit on password autofill**.

**Architecture:** As in Phase 3, all math is pure and tested in `src/lib/game/`. One loader, `loadScoringData(userId, upTo)`, feeds Today, quest and stats pages, so there's a single source of truth. Tapping a calendar day reuses the Today screen at `/?date=` rather than building a second log editor (DRY).

**Spec:** §4 (completion %, grade), §6 (quest view, results, stats).

---

## Decisions
- **Quest completion % uses that quest's own targets** (not the max across overlapping quests), so a quest's grade reflects the quest you set. XP, by contrast, is global per day (spec §4).
- **Grade:** S ≥ 95%, A ≥ 85%, B ≥ 70%, C ≥ 50%, D below that. Calculated over elapsed days while active ("preview"), and over all days once ended.
- **Best streak** on the results screen is the *longest* run of met days inside the quest window. (The Today 🔥 streak is the *current* run.)
- **Heatmap:** daily completion is the average of `min(amount/target, 1)` across that day's targeted habits. It uses one green hue in 5 bins (0, 1–49%, 50–79%, 80–99%, 100%). Days with no quest get a neutral dashed cell. Every cell has a tooltip and aria-label. Months are mini calendars (7 columns), which fit a phone better than a 53-week strip.
- **Undo (option A, Katie's pick):** each card keeps a stack of inverse actions for this page visit. Undoing a quick-add sends `add −n`, which stays correct even with rapid taps; undoing a SET restores the previous total. An "↶ UNDO +25" button appears **below** the buttons, so nothing shifts under your thumb. `logProgressSchema` now allows a negative add (non-zero), and SQL clamps the total to 0..1,000,000.
- **Auto-login (autofill only, Katie's pick):** submit once both fields have values **and** the last change to the password field wasn't typing (`inputType` isn't `insertText`/`deleteContent*`/paste, which is how Keychain/Face ID and browser autofill report). Fires at most once per page load, so a wrong saved password can't loop.

## File map
| File | Responsibility |
|---|---|
| `src/lib/game/report.ts` (+test) | `grade`, `longestStreak`, `questReport` |
| `src/lib/game/stats.ts` (+test) | `dayCompletion`, `yearSummary`, `heatBin` |
| `src/lib/queries/scoring.ts` | `loadScoringData(userId, upTo)`. `queries/game.ts` uses it. |
| `src/lib/queries/quests.ts` | + `getQuest(userId, id)` (with habits), `listUserHabits(userId)` |
| `src/app/(game)/quests/[id]/page.tsx` | Calendar grid (days × habits), tap a day → `/?date=` |
| `src/app/(game)/quests/[id]/results/page.tsx` | Grade, completion, per-habit totals and best streaks, XP |
| `src/app/(game)/stats/page.tsx` | Year selector, summary tiles, per-habit totals, month heatmaps |
| `src/app/(game)/layout.tsx` | Nav gains STATS |
| `src/app/(game)/habit-card.tsx` | Undo stack + button |
| `src/lib/validation.ts` (+test) | Negative add allowed, 0 rejected |
| `src/app/(game)/actions.ts` | Clamp to ≥ 0 |
| `src/app/login/login-form.tsx` | Autofill auto-submit |

## Tasks
1. **report.ts (TDD).** Grade thresholds (95→S, 94.9→A, 85→A, 70→B, 50→C, 49→D). `longestStreak` with gaps. `questReport` for an active quest counts only elapsed days, and an ended quest counts all days. Covers per-habit totals, daysMet, bestStreak, xpEarned within the window, and missing logs as 0.
2. **stats.ts (TDD).** `dayCompletion` averages capped fractions. `yearSummary` covers totals by habit for the year only, daysMet, perfectDays, xp, a completion map, and ignores other years. `heatBin` boundaries.
3. **Validation + action** for negative adds (TDD for the schema).
4. **`loadScoringData`**, refactoring `getGameState` onto it.
5. **Quest detail page**, and quest cards link to it.
6. **Results page.**
7. **Stats page** and the nav link.
8. **Undo button.**
9. **Login autofill.**
10. **Verify** with a throwaway test user (Katie's data is live): the calendar colors, results numbers checked against hand-computed values, the heatmap, undo (two taps then two undos, and undo after SET), and autofill (simulated autofill submits; typing doesn't). Delete the test user afterward.
11. **Developer Guide, PR.** No migrations.
