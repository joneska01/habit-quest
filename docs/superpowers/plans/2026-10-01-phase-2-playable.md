# Habit Quest — Phase 2: Playable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Katie can log her October habits on her phone: a Today screen with progress bars and quick-add buttons, the ability to step back to past days, a quest list, and a New Quest screen that picks from the habit library or adds new habits to it.

**Architecture:** Pure logic (dates, quest math, quick-add sizing, daily targets) lives in `src/lib/` and is covered by Vitest. DB reads go in `src/lib/queries/`, writes go in Server Actions validated by Zod schemas from `src/lib/validation.ts`, and pages are Server Components. The only client components are the interactive habit card (using `useOptimistic`) and the New Quest form.

**Spec:** §4 (target rule), §5 (quests), §6 (screens + logging controls), §10 (errors).

---

## Decisions in this phase
- **Logging past days ships now, not in Phase 4.** The Today screen accepts `/?date=YYYY-MM-DD` and has ◀ ▶ day arrows (no future dates). It's cheap, and it means October 1 is never lost. Phase 4 adds the calendar grid as a nicer way to get to a day.
- **Quick-add buttons** are about 10%, 25% and 50% of the target, rounded to friendly numbers (1/2/2.5/5 × 10ⁿ). That gives 100 → +10 / +25 / +50, steps 10,000 → +1,000 / +2,500 / +5,000, and reading 20 min → +2 / +5 / +10. Corrections go through **Set**. (The spec said ~10% and 25%; a third button fits on a phone and helps.)
- **No separate /habits page (YAGNI).** You create habits inline on the New Quest screen.
- **Logged-in pages** go in an `(game)` route group whose layout adds the top nav (TODAY · QUESTS · logout).

## File map

| File | Responsibility |
|---|---|
| `src/lib/dates.ts` (+test) | `todayInChicago`, `addDays`, `endOfMonth`, `isIsoDate`, `formatDayLabel`, `formatRange` |
| `src/lib/quests.ts` (+test) | `questEndDate`, `suggestQuestName`, `questStatus` |
| `src/lib/logging.ts` (+test) | `niceRound`, `quickAddAmounts`, `progressFraction`, `formatAmount`, `unitLabel` |
| `src/lib/game/targets.ts` (+test) | `buildDayHabits`: collapses quest-habit rows plus logs into one entry per habit for a date, using the max target (spec §4) |
| `src/lib/palette.ts` | Habit color names → CSS vars, plus icon choices (shared by forms and cards) |
| `src/lib/validation.ts` (+test) | Zod: `logProgressSchema`, `createHabitSchema`, `createQuestSchema` |
| `src/lib/queries/day.ts` | `getDayHabits(userId, date)` |
| `src/lib/queries/quests.ts` | `listQuests(userId)`, `listLibraryHabits(userId)` |
| `src/app/(game)/layout.tsx` | Nav bar + `requireUser()` |
| `src/app/(game)/page.tsx` | Today screen (moved from `src/app/page.tsx`) |
| `src/app/(game)/habit-card.tsx` | Client: progress bar, quick-adds, Set, check toggle |
| `src/app/(game)/actions.ts` | `logProgress`, `logout` (moved) |
| `src/app/(game)/quests/page.tsx` | Quest list (active / upcoming / completed), delete |
| `src/app/(game)/quests/new/page.tsx`, `new-quest-form.tsx`, `new-habit-form.tsx` | New Quest flow |
| `src/app/(game)/quests/actions.ts` | `createQuest`, `deleteQuest`, `createHabit` |

## Tasks

### Task 1: Date helpers (TDD)
Tests (`src/lib/dates.test.ts`):
- `todayInChicago(new Date("2026-10-01T04:30:00Z"))` → `"2026-09-30"` (11:30pm CDT)
- `todayInChicago(new Date("2026-10-01T05:30:00Z"))` → `"2026-10-01"`
- `todayInChicago(new Date("2026-12-01T05:30:00Z"))` → `"2026-11-30"` (CST, UTC−6)
- `addDays("2026-10-31", 1)` → `"2026-11-01"`; `addDays("2026-10-01", -1)` → `"2026-09-30"`
- `endOfMonth("2026-10-01")` → `"2026-10-31"`; `endOfMonth("2028-02-10")` → `"2028-02-29"`; `endOfMonth("2026-02-10")` → `"2026-02-28"`
- `isIsoDate("2026-10-01")` → true; `"2026-13-01"`, `"2026-02-30"` and `"nope"` → false
- `formatDayLabel("2026-10-01")` → `"Thu, Oct 1"`
- `formatRange("2026-10-01","2026-10-31")` → `"Oct 1 – Oct 31"`

Implementation: plain `YYYY-MM-DD` strings. Arithmetic goes through `Date.UTC` so time zones never shift a day. `todayInChicago` uses `Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" })`.

### Task 2: Quest helpers (TDD)
- `questEndDate("week","2026-10-01")` → `"2026-10-07"`; `questEndDate("month","2026-10-01")` → `"2026-10-31"`; `questEndDate("month","2026-10-15")` → `"2026-10-31"`
- `suggestQuestName("month","2026-10-01")` → `"October 2026"`; `suggestQuestName("week","2026-10-01")` → `"Week of Oct 1"`
- `questStatus({startDate,endDate}, today)` → `"upcoming"`, `"active"` (inclusive on both ends) or `"completed"`

### Task 3: Logging helpers (TDD)
- `niceRound`: 10→10, 25→25, 50→50, 1000→1000, 2500→2500, 2→2, 7→5, 0.3→1, 13→10, 40→50
- `quickAddAmounts(100)` → `[10,25,50]`; `(10000)` → `[1000,2500,5000]`; `(20)` → `[2,5,10]`; `(1)` → `[1]` (deduped)
- `progressFraction(50,100)` → 0.5; `(150,100)` → 1; `(0,0)` → 0
- `formatAmount(10000)` → `"10,000"`
- `unitLabel("minutes")` → `"min"`; `"count"` → `""`; `"check"` → `""`

### Task 4: Day targets (TDD) — `src/lib/game/targets.ts`
`buildDayHabits(rows, logs)`: `rows` are quest-habit rows active on the date (habit fields + `dailyTarget` + quest name). `logs` are `{habitId, amount}[]` for the date. It returns one `DayHabit` per habit, sorted by habit id: `{ habitId, name, unit, icon, color, target, amount, quests: string[] }`.
- one row → target equals that row's target, and amount is 0 when there's no log
- the same habit in two overlapping quests with targets 100 and 150 → **target 150** (max), and `quests` lists both names
- a log is matched by habitId

### Task 5: Validation (TDD-light)
- `logProgressSchema`: `{ habitId: int>0, date: isIsoDate, mode: "add"|"set", amount: int }`. Add mode allows 1..1,000,000. Set mode allows 0..1,000,000.
- `createHabitSchema`: name trimmed (1–40 chars), unit enum, defaultTarget int 1..1,000,000 (check habits force 1), color in palette, icon from the icon list.
- `createQuestSchema`: name (1–60 chars), period enum, startDate ISO, habits `[{habitId, dailyTarget}]` with at least 1 entry and unique ids.
- Tests: valid inputs pass; a negative add, a future-format date string and an empty habits list each fail.

### Task 6: Palette + queries
- `palette.ts`: `HABIT_COLORS = ["brick","berry","grape","ocean","grass","coin","lime","peach","sky"]` → `var(--color-x)`; `HABIT_ICONS` = 16 emoji.
- `getDayHabits(userId, date)`: join quest_habits→quests→habits where the user matches, start ≤ date ≤ end and the habit isn't archived. Read logs for those habit ids on that date. Return `buildDayHabits(...)`.
- `listQuests(userId)`: quests with their habits (icon, name, target), ordered by startDate desc.
- `listLibraryHabits(userId)`: non-archived habits ordered by name.

### Task 7: Route group, nav, Today screen, habit card, logProgress
- Move `src/app/page.tsx` and `src/app/actions.ts` into `src/app/(game)/`. The layout calls `requireUser()` and renders the nav.
- Today: reads `?date`, which defaults to today. An invalid date or one after today redirects to `/`. The header shows ◀, the day label ("TODAY" when it's today) and ▶ (hidden on today). It lists the habit cards. If no habits are active that day, a pixel card says "No active quest — START A QUEST ▶".
- `HabitCard` (client): icon, name, `amount / target unit`, a segmented progress bar (10 segments in the habit's color, gold border when complete, ⭐ CLEAR! badge), quick-add buttons, and a **Set** button that reveals a number input plus Save. Check habits get one big toggle button ("DONE ✓" / "MARK DONE"). Uses `useOptimistic` plus `startTransition`. If the action returns `{ error }`, it shows the message inline; the optimistic value rolls back automatically.
- `logProgress` action: `requireUser`, Zod parse, reject `date > todayInChicago()`, confirm the habit is owned and not archived, then upsert: add mode does `amount = logs.amount + delta`, set mode does `amount = value`, and `updated_at = now()`. Then `revalidatePath("/")`. Returns `{ ok: true } | { error }`.

### Task 8: Quests list + delete
- `/quests`: a "+ NEW QUEST" button, then Active / Upcoming / Completed sections. Each quest card shows the name, date range, period badge and habit chips (icon + target). Delete is a small form whose button opens a `confirm()` client check. `deleteQuest` verifies ownership, deletes (logs stay), and revalidates `/` and `/quests`.

### Task 9: New Quest
- The page loads the library habits and today's date.
- `NewQuestForm` (client): Week/Month toggle, start date (default today, min today − 7), and a name that follows `suggestQuestName` until the user edits it. Shows the computed end date. Lists each library habit with a checkbox and a target input prefilled with its default (check habits show "daily ✓", no input). Submit → `createQuest` (Zod, verify every habit is owned, insert the quest and quest_habits in a transaction, redirect to `/`).
- `NewHabitForm` (client, below the quest form): name, unit (Count / Minutes / Check), default target, icon picker, color picker. Submit → `createHabit` (a duplicate name gives a friendly error) → revalidate. The new habit appears in the quest form's list, and the quest form keeps its state because it's the same component.

### Task 10: Verify in the browser
- Minted cookie (as in Phase 1). Today shows the 5 October habits.
- Tap +25 on Push-ups → 25/100 instantly, and it persists after reload.
- Set Steps to 10,000 → ⭐ CLEAR!
- Go back one day (◀) to Sep 30 → "No active quest" (October starts Oct 1). ▶ returns. `/?date=2026-10-02` redirects to `/`.
- Create a test Week quest with a new "Water" check habit. Toggle it. Delete the quest, then archive and delete the test habit and its logs with a DB cleanup script. **Remove all test logs I made on the real October data before finishing, and tell Katie.**
- Check the 375px phone layout and the console.

### Task 11: Docs + PR
- Update the Developer Guide: phase status, new files, logging rules, past-day logging via `?date=`.
- `npm test`, `tsc`, `lint`, then stop dev and run `build`.
- Commit, push, open the PR. The PR body notes that there are no migrations in this phase.
