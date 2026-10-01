# Habit Quest — Design Spec

**Date:** 2026-10-01
**Owner:** Katie Jones
**Status:** Approved design, pending spec review

## 1. Goal

A lightweight, phone-first habit tracker with a bright retro 8-bit platformer feel. Group daily habits into time-boxed **Quests** (weekly or monthly), log progress each day, earn XP and levels, and see yearly totals.

**First use case (starting 2026-10-01):** an "October" monthly quest running Oct 1 to Oct 31 with:

| Habit | Unit | Daily target |
|---|---|---|
| Squats | count | 100 |
| Push-ups | count | 100 |
| Crunches | count | 100 |
| Steps | count | 10,000 |
| Reading | minutes | 20 (default, can be edited at seed time) |

## 2. Tech stack

Katie's standard stack:

- Next.js (App Router) + React + TypeScript (strict mode)
- Tailwind CSS v4, CSS-first config (`@theme` tokens in `globals.css`)
- Postgres (Neon via Vercel Marketplace) + Drizzle ORM. Migrations are generated and applied manually.
- Zod validation on all Server Action inputs
- iron-session for the session cookie, with bcryptjs password hashing against a `users` table
- Vitest for pure game and date logic
- Fonts via `next/font/google`
- Hosted on Vercel, auto-deploying from `main`. Repo is `habit-quest` (private) under Katie's GitHub account.

## 3. Data model

```
users        id, email (unique), password_hash, display_name, created_at
habits       id, user_id → users, name, unit ('count'|'minutes'|'check'),
             default_target int, color, icon, archived bool, created_at
quests       id, user_id → users, name, period ('week'|'month'),
             start_date date, end_date date, created_at
quest_habits id, quest_id → quests (cascade), habit_id → habits,
             daily_target int        UNIQUE(quest_id, habit_id)
logs         id, user_id → users, habit_id → habits, date date,
             amount int ≥ 0, updated_at
             UNIQUE(habit_id, date)
```

**Key decisions**

- **Logs belong to (habit, date), not to a quest.** A quest is a date window over its habits' logs. Overlapping quests never double-count, and yearly totals are a plain `SUM`.
- **The target is snapshotted on `quest_habits.daily_target`**, so changing a habit's default target never rewrites past quests.
- **One log row per habit per day.** It stores the running daily total, and quick-adds update it (upsert).
- **`check` habits** store `amount` as 0 or 1 with a target of 1.
- **No derived game state is stored.** XP, levels, streaks and grades are always computed from logs (see §4), so backfilling past days stays consistent automatically.

## 4. Game rules (`src/lib/game/` — pure functions, no DB, Vitest-covered)

**Target for a habit on a date:** the maximum `daily_target` among the user's quests that include that habit and whose window covers that date. If no quest covers it, the habit has no target that day, so the day neither counts toward nor breaks anything.

**A day is "met"** for a habit when `amount ≥ target`.

**XP**
- +10 XP for each (habit, date) that is met
- +25 XP **perfect-day bonus** when every habit with a target that date is met
- Only dates ≤ today (America/Chicago) count. Partial progress earns no XP but still fills the progress bar.

**Levels:** going from level L to L+1 costs `100 + 25 × (L − 1)` XP, so 100, 125, 150 and so on. Everyone starts at level 1. Example: a perfect day with 5 habits = 75 XP, so roughly level 6 after a perfect October.

**Streaks**
- *Habit streak:* consecutive targeted days met, ending today. If today isn't met yet, the streak ends at yesterday, so an unfinished today doesn't break it.
- *Perfect-day streak:* the same rule, applied to perfect days.
- Days with no target are skipped and don't break a streak.

**Quest completion %:** the average of `min(amount / target, 1)` across all (habit, day) cells. While a quest is active, only elapsed days count.

**Grade** (on the final completion %): S ≥ 95%, A ≥ 85%, B ≥ 70%, C ≥ 50%, D below that.

**Dates:** all "today" logic uses `America/Chicago`. Dates are stored as plain `date` values (no time zone).

## 5. Quests

- **Week quest:** a start date (defaults to today) plus 6 days, for 7 days total.
- **Month quest:** a start date (defaults to today) through the last day of that calendar month.
- When creating a quest you name it (auto-suggested, e.g. "October 2026" or "Week of Oct 1"), then pick habits from your library or create new ones inline, then set each daily target (prefilled from the habit's default).
- Multiple quests can be active at once.
- v1 supports **deleting** a quest but not editing it (YAGNI). Deleting a quest leaves its logs in place.

## 6. Screens

| Route | Purpose |
|---|---|
| `/login` | Email + password. No sign-up page. |
| `/` **Today** | A heads-up display (HUD) at the top: level, XP bar, perfect-day streak. Below it, one card per habit across the active quests: progress bar, 🔥 streak, and quick-add controls. |
| `/quests` | A list of active, upcoming and completed quests. |
| `/quests/new` | Create a quest (see §5). |
| `/quests/[id]` | Quest calendar grid (days × habits, colored by % done). Tap any past or present day to open a log editor for that day. |
| `/quests/[id]/results` | A "level clear" screen: grade, completion %, totals per habit, best streak, XP earned. Reachable once the quest has ended; a preview is available while active. |
| `/stats` | A year selector, totals per habit for that year, and a calendar heatmap of daily completion. |

**Logging controls**
- `count` / `minutes`: quick-add buttons sized to the target (about 10% and 25% of the target, rounded to a friendly number, e.g. +10/+25 for 100 push-ups, +1,000/+2,500 for steps), plus a **Set** button to type an exact total (useful for steps read off a phone; also how you correct mistakes).
- `check`: a single tap toggles it.
- Logging is allowed for any date ≤ today. Future dates are rejected.

## 7. Visual design — bright retro platformer

The look is inspired by classic 8-bit platformers (Super Mario Bros. era): bright, cheerful and colorful. **It is not a dark theme, and not limited to primary colors.** It uses original styling only, with no Nintendo characters, sprites, names or logos.

- **Background:** a sky-blue gradient with simple pixel clouds and a grass/ground strip at the bottom of the page.
- **Palette** (Tailwind `@theme` tokens):
  - sky `#6EC6FF`, cloud `#FFFFFF`, grass `#4CC552`, ground `#C8763A`
  - coin `#FFC93C`, brick `#E86A33`, berry `#FF5DA2`, grape `#9B5DE5`
  - ocean `#00BBF9`, lime `#B8E04A`, peach `#FFB385`, ink `#2B2D42` (outlines and text)
- **Each habit gets its own color** from the palette, used for its progress bar and calendar cells.
- **Cards:** cream or white blocks with chunky 4px ink borders and a hard, unblurred offset shadow (pixel-block feel). Buttons look like "?" blocks or pipes.
- **Type:** *Press Start 2P* for headings, numbers and the HUD. *Nunito* for body text and labels, so it stays readable on a phone.
- **Juice:** a "+10 XP" coin pop when a habit is met, a bouncing **LEVEL UP!** banner, a star burst on a perfect day, and progress bars that fill in segmented "health bar" steps. All of this respects `prefers-reduced-motion`.
- **Layout:** phone first, single column, tap targets ≥ 44px. Desktop centers the same column. v1 has a light theme only.
- Out of scope for v1: sound effects, badges/achievements, dark mode.

## 8. Auth & security

- A `users` table with a bcrypt hash (cost 12). The iron-session cookie holds `userId`, using `SESSION_SECRET`.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) redirects any unauthenticated request to `/login`.
- Every query and action is scoped by the session's `userId`. Ownership of habits and quests is checked on every write.
- A seed script (`npm run db:seed`) creates Katie's user from the `SEED_EMAIL` / `SEED_PASSWORD` env vars (never committed), plus the five habits and the October 2026 quest. It is idempotent.

## 9. Architecture & data flow

- **Server Components** load page data through `src/lib/queries/*` (Drizzle, scoped by user).
- **Server Actions** (`src/app/**/actions.ts`) validate input with Zod (`src/lib/validation.ts`), check ownership, write data, then call `revalidatePath`.
- **Game math lives only in `src/lib/game/*`.** Pages and actions import from it; nothing recomputes XP or streaks anywhere else.
- **Client components** handle only interactivity: quick-add buttons, optimistic progress-bar updates and animations.
- No polling is needed, since it's a single user on one device at a time.

## 10. Error handling

- Zod rejects bad input with a friendly inline message: non-integer or negative amounts, amounts over 1,000,000, future dates, empty names.
- Not-found or not-owned quests and habits return `notFound()`.
- Login failures show a generic "Invalid email or password".
- If an optimistic log update fails, the UI rolls back and shows a toast.

## 11. Testing

- **Vitest** covers `src/lib/game/*` and the date helpers: XP, level curve boundaries, streak edge cases (unfinished today, untargeted gap days, backfill), perfect days, overlapping-quest targets, completion %, grade thresholds, and quest end-date math (month end, leap years, Chicago "today" around midnight UTC).
- **Manual verification** in the browser preview, with screenshots at the end of each phase.

## 12. Phases (checkpoint and approval between each)

1. **Foundation:** scaffold the app, GitHub repo, Vercel project, Neon database, Drizzle schema and migration, login/logout, seed script, Developer Guide.
2. **Playable:** habit library, create a quest, Today screen with logging. Katie starts tracking October here; Oct 1 can be backfilled.
3. **Game layer:** XP, levels, streaks, HUD, the full 8-bit visual pass and animations.
4. **Endgame:** quest calendar with backfill editing, results screen, year stats page.

## 13. Out of scope (v1)

Sign-up flow, multiple users in the UI, badges, sound, dark mode, notifications/reminders, editing quests, frequency-based habits (e.g. "3× per week"), native app, offline mode.
