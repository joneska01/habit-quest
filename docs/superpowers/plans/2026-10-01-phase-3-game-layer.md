# Habit Quest — Phase 3: Game Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn logging into a game: XP, levels, per-habit 🔥 streaks and a perfect-day streak, a status bar (HUD) on the Today screen, and animations for "+10 XP" coins, perfect days and LEVEL UP. Plus the visual polish pass: pixel clouds, and darker error text for contrast.

**Architecture:** All game math lives in `src/lib/game/*` as pure, tested functions (spec §4). **Nothing is stored.** One query loads the user's quest-habit windows and all logs up to today, and the pure functions compute XP, level and streaks on every render, so logging past days automatically re-scores everything. The client only animates *changes* in the server-computed values (it compares the previous and next props).

**Spec:** §4 (game rules), §7 (visual design and juice).

---

## Game rules (from spec §4; restated so the tests are unambiguous)
- **Target calendar:** for each date from the first quest start through today, each habit's target is the max `daily_target` across quests covering that date.
- **Met:** `amount ≥ target`.
- **XP:** +10 per met (habit, day) and +25 per perfect day (every targeted habit met). Only dates ≤ today count.
- **Level:** going from L to L+1 costs `100 + 25 × (L − 1)` XP, and the player starts at level 1. So 0 XP is level 1, 100 XP is level 2, 225 XP is level 3, and 375 XP is level 4.
- **Streak** (habit or perfect day): walk backward over **targeted** days only. If today is targeted but not yet met, start from yesterday (an unfinished today never breaks a streak). Count consecutive met days and stop at the first miss.

## File map
| File | Responsibility |
|---|---|
| `src/lib/game/levels.ts` (+test) | `levelCost`, `levelFromXp` → `{ level, xpIntoLevel, xpForNextLevel }` |
| `src/lib/game/score.ts` (+test) | `buildTargetCalendar`, `scoreDays`, `totalXp`, `streak`, `computeGameState` |
| `src/lib/queries/game.ts` | `getGameState(userId, today)`: two queries, then `computeGameState` |
| `src/app/(game)/hud.tsx` | Client: level, XP bar, perfect-day streak; LEVEL UP! banner on increase |
| `src/app/(game)/day-banner.tsx` | Client: "x / y CLEARED" with a star burst and "+25 XP PERFECT DAY!" on reaching perfect |
| `src/app/(game)/habit-card.tsx` | + 🔥 streak badge, + "+10 XP" coin pop when it flips to cleared |
| `src/app/(game)/page.tsx` | Loads the game state alongside the day habits |
| `src/app/globals.css` | `--color-danger`, keyframes, `.anim-*` classes, reduced-motion guard |
| `src/app/sky.tsx` + `layout.tsx` | Decorative pixel clouds behind the content |

## Tasks
1. **Levels (TDD).** `levelFromXp(0)` → L1 0/100; `(99)` → L1 99/100; `(100)` → L2 0/125; `(224)` → L2 124/125; `(225)` → L3 0/150; `(375)` → L4 0/175.
2. **Score (TDD).**
   - `buildTargetCalendar`: one quest Oct 1–3 with today = Oct 2 gives only Oct 1–2. Overlapping quests take the max target. A quest starting after today contributes nothing.
   - `scoreDays`: counts met, total and perfect per day.
   - `totalXp`: two habits on a perfect day = 45, one of two met = 10.
   - `streak`: 3 met days in a row = 3; an unmet today is skipped (still 3); a met today = 4; a miss two days ago stops the count; untargeted gap days are skipped, not broken; backfilling a missed day extends the streak.
   - `computeGameState`: the end-to-end example from the rules above.
3. **Query** `getGameState`.
4. **HUD + day banner + streak badges + coin pop:** wire them into Today.
5. **CSS polish:** clouds, danger color (replacing `text-brick` for errors), animations, reduced motion.
6. **Verify with a throwaway test user** (Katie is actively logging, so her account is not touched). Seed user #N with 2 habits and a quest backfilled with logs, mint a cookie for it, and check the HUD numbers against the hand-computed expected values, the streaks, the coin pop, the perfect day and LEVEL UP. **Delete the test user afterward** (cascades).
7. **Developer Guide update, PR.** No migrations.
