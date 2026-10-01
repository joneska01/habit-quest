# Habit Quest — Developer Guide

## Overview

A phone-first habit tracker with a bright retro 8-bit platformer feel. Habits are grouped into time-boxed **Quests** (weekly or monthly), progress is logged per habit per day, and XP, levels and streaks are computed from those logs.

- **Design spec:** [`docs/superpowers/specs/2026-10-01-habit-quest-design.md`](docs/superpowers/specs/2026-10-01-habit-quest-design.md)
- **Phase plans:** [`docs/superpowers/plans/`](docs/superpowers/plans/)
- **Repo:** `joneska01/habit-quest` (private). **Hosting:** Vercel project `habit-quest`, which auto-deploys from `main`.

### Phase status

| Phase | Scope | Status |
|---|---|---|
| 1. Foundation | Schema, auth, seed, base theme, Developer Guide | ✅ Done |
| 2. Playable | Habit library, create quest, Today logging, past-day logging | ✅ Done |
| 3. Game layer | XP, levels, streaks, HUD, animations | ✅ Done |
| 4. Endgame | Quest calendar, results screen, year stats, undo, autofill login | ✅ Done |
| + Home screen icon | Pixel-star icon, web manifest, standalone iPhone launch | ✅ Done |
| Nudges N1 | Evening in-app banner (5 pm) | ✅ Done |
| Nudges N2 | iPhone push at 7 pm | ✅ Done (verify on iPhone after deploy) |

## Stack

| Piece | Version / choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript (strict mode) |
| Styling | Tailwind CSS v4, CSS-first `@theme` tokens in `src/app/globals.css` |
| Database | Neon Postgres (Vercel Marketplace), `postgres` driver |
| ORM | Drizzle ORM 0.45 / drizzle-kit 0.31 |
| Auth | `users` table + bcryptjs (cost 12) + iron-session 9 cookie |
| Validation | Zod 4 |
| Tests | Vitest 5 |
| Fonts | `next/font/google`: Press Start 2P (pixel headings) + Nunito (body) |

## Local setup

```bash
git clone https://github.com/joneska01/habit-quest.git && cd habit-quest
npm install
vercel link --project habit-quest     # connect the folder to the Vercel project
vercel env pull .env.local            # DATABASE_URL, SESSION_SECRET, Neon vars
```

Then **re-add your seed lines** to the bottom of `.env.local` (see Environment variables below) and run:

```bash
npm run db:migrate   # apply any pending migrations
npm run db:seed      # create/refresh your user, starter habits and the October quest
npm run dev -- --port 3100
```

Use port **3100** so Habit Quest doesn't collide with the Oasis dashboard on 3000. In the Claude desktop app, the dev server runs in a Terminal tab, because the preview tool is tied to the folder the session started in.

## Environment variables

| Name | Where it lives | Purpose |
|---|---|---|
| `DATABASE_URL` | Vercel, all environments (added by the Neon integration) | Postgres connection string |
| `SESSION_SECRET` | Vercel. **Production + Preview:** a sensitive secret. **Development:** a separate, non-sensitive value. | Encrypts the session cookie. Must be 32+ characters. |
| `VAPID_PUBLIC_KEY` | Vercel, all environments (config) and `.env.local` | Push key the browser subscribes with (passed to the client as a prop) |
| `VAPID_PRIVATE_KEY` | Vercel: sensitive in Production/Preview, config in Development, plus `.env.local` | Signs pushes. **Same pair everywhere**: a subscription only works with the pair that made it. |
| `CRON_SECRET` | Vercel Production (sensitive). A separate value in `.env.local` | Vercel sends it as `Authorization: Bearer …` to the cron route |
| `SEED_EMAIL` | `.env.local` only | Your login email |
| `SEED_PASSWORD` | `.env.local` only, never committed | Your login password. Only its bcrypt hash is stored. |
| `SEED_DISPLAY_NAME` | `.env.local` only | Name shown in the app, e.g. "Katie" |

The Neon integration also adds `POSTGRES_*` / `PG*` variables. The app only uses `DATABASE_URL`.

## Project structure

```
src/
  app/
    layout.tsx              fonts, metadata, page column, <Sky />
    sky.tsx                 decorative pixel clouds
    pixel-icon.tsx          shared pixel-star icon renderer (next/og)
    icon.tsx                /icon/32, /icon/192, /icon/512
    apple-icon.tsx          /apple-icon (180px, iPhone home screen)
    manifest.ts             /manifest.webmanifest (standalone, sky theme)
    globals.css             @theme palette, sky/grass background, pixel-* classes
    login/                  page, client form (useActionState), login server action
    (game)/                 everything behind login (route group = no URL segment)
      layout.tsx            requireUser() + nav (TODAY · QUESTS · STATS · logout)
      page.tsx              Today screen; ?date=YYYY-MM-DD for past days
      habit-card.tsx        client: progress bar, quick-adds, Set, check toggle (useOptimistic), streak, coin pop, undo
      hud.tsx               client: level, XP bar, perfect-day streak, LEVEL UP! banner
      day-banner.tsx        client: x / y CLEARED → PERFECT DAY with star burst
      nudge-banner.tsx      evening reminder + ✕ dismiss (server action sets a per-day cookie)
      nudge-cookie.ts       cookie name (kept out of actions.ts: "use server" files export async fns only)
      reminder-toggle.tsx   client: 🔔 card — unsupported / blocked / TURN ON / SEND TEST / TURN OFF
      push-actions.ts       savePushSubscription, deletePushSubscription, sendTestPush
    api/cron/nudge/route.ts 7 pm push sender (CRON_SECRET); called by vercel.json crons
      actions.ts            logProgress, logout
      quests/
        page.tsx            quest log (active / upcoming / completed)
        delete-quest-button.tsx
        actions.ts          createQuest, deleteQuest, createHabit
        new/                New Quest page + new-quest-form + new-habit-form
        [id]/page.tsx         quest calendar (days × habits); tap a day → /?date=
        [id]/results/         grade, completion, totals, best streaks, XP
      stats/page.tsx        year totals + daily-completion heatmap (?year=)
  lib/
    types.ts                HABIT_UNITS, QUEST_PERIODS (shared by schema + logic)
    dates.ts                Central-time "today", date math, labels (+ test)
    quests.ts               questEndDate, suggestQuestName, questStatus (+ test)
    logging.ts              quick-add sizing, progress, formatting (+ test)
    palette.ts              habit colors + icon choices
    validation.ts           Zod schemas for every action (+ test)
    game/targets.ts         buildDayHabits — the max-target rule (+ test)
    game/levels.ts          level curve (+ test)
    game/score.ts           target calendar, XP, streaks, computeGameState (+ test)
    game/report.ts          grade, longestStreak, questReport (+ test)
    game/stats.ts           yearSummary, heatBin (+ test)
    game/nudge.ts           nudgeFor + NUDGE_HOUR — shared by banner and push (+ test)
    push-logic.ts           PUSH_HOUR, isPushHour, isGoneStatus, urlBase64ToUint8Array (+ test)
    push.ts                 sendToUser via web-push; prunes 404/410 subscriptions (server-only)
    grade-style.ts          grade → color
    queries/                scoring.ts (loadScoringData — shared loader), day.ts, quests.ts, game.ts, nudge.ts
    auth/                   constants, password (+ test), session
    db/                     schema.ts, client.ts
  proxy.ts                  redirects signed-out requests to /login
scripts/seed.ts             idempotent seed
public/sw.js                service worker: shows push, opens the app on tap
vercel.json                 two daily crons (00:00 + 01:00 UTC) → /api/cron/nudge
drizzle/                    generated SQL migrations (committed)
```

## Database & migrations

Tables: `users`, `habits` (your habit library), `quests`, `quest_habits` (which habits are in a quest, plus the daily target snapshot) and `logs` (one row per habit per day). See spec §3 for why logs are keyed to (habit, date) rather than to a quest.

To change the schema:
1. Edit `src/lib/db/schema.ts`.
2. Run `npm run db:generate` and **read the generated SQL** in `drizzle/`.
3. Run `npm run db:migrate`.
4. Commit the schema change and the migration together.

**Vercel does not run migrations.** Apply them yourself **before merging** a PR that changes the schema.

⚠️ **Local and production share one Neon database.** Anything you log while testing locally is your real data.

## Logging rules

- One `logs` row per habit per day, holding the running total. Quick-adds upsert `amount + n` (capped at 1,000,000), and **Set** replaces the total (use it for corrections). Check habits are 0 or 1.
- A habit's target on a day is the **highest** `daily_target` among the quests covering that day (`lib/game/targets.ts`).
- **Past days:** ◀ on the Today screen, or `/?date=YYYY-MM-DD`. Future and invalid dates redirect to `/`, and the server action rejects future dates too.
- Quick-add buttons are about 10%, 25% and 50% of the target, rounded to friendly numbers (`lib/logging.ts`).
- **Deleting a quest keeps its logs** (they belong to the habit), so the year totals stay intact.
- All "today" logic uses America/Chicago (`lib/dates.ts`).

## Game rules (spec §4)

Nothing game-related is stored. `getGameState` loads the quest windows and all logs up to today, and `lib/game/score.ts` computes everything on each render, so backfilling a past day re-scores automatically.

- **XP:** +10 per habit that hits its target on a day, and +25 for a perfect day (every targeted habit met).
- **Levels:** going from L to L+1 costs `100 + 25 × (L − 1)` (100, 125, 150 …).
- **Streaks:** consecutive *targeted* days met. Untargeted days are skipped, and an unfinished today doesn't break a streak. Habit streaks show on Today only, since they always end today.
- **Animations:** the client compares the new server values with the previous ones ("adjust state on prop change", no effects or timers). A habit flipping to cleared gets a coin pop, reaching all-cleared gets the perfect-day burst, and a level increase shows LEVEL UP!. With `prefers-reduced-motion`, animations become a simple show-then-fade.

**Testing the game safely:** your real account shares the DB, so create a throwaway user (insert into `users` with password_hash `!disabled`, add habits, a quest and backfilled logs), mint a cookie for its id, and delete the user afterward (everything cascades).

## Quests, results and stats

- **Quest completion %** averages `min(amount / target, 1)` over every (habit, day) cell, using **this quest's own targets**. Elapsed days only while active.
- **Grade:** S ≥ 95%, A ≥ 85%, B ≥ 70%, C ≥ 50%, D below that. *Best streak* on the results screen is the longest run inside the quest. The 🔥 on Today is the *current* run.
- **Year heatmap:** one green hue in 5 bins (0, <50%, <80%, <100%, 100%). Days with no quest are dashed. Every cell has a tooltip and aria-label, and the "Year totals" list is the table version of the data.
- All three pages and the HUD read the same `loadScoringData`, so they always agree.

## Nudges

- `nudgeFor` (pure, tested) returns one message, or `null` before `NUDGE_HOUR` (17 = 5 pm Central), when all habits are cleared, or when nothing is tracked today.
- **Title priority:** perfect-day streak at risk, then the longest habit streak at risk (≥ 2 days), then "Nothing logged yet today", then "N habits left today". The body lists up to 3 remaining habits plus the XP still available.
- **Banner:** Today screen only (not past days). ✕ calls `dismissNudge(date)`, which sets the httpOnly cookie `hq_nudge_dismissed=<date>`, so it's hidden for that day only. No localStorage and no flash on reload.
- **To preview the banner before 5 pm locally,** temporarily lower `NUDGE_HOUR`, and don't commit that.

## Push reminders (N2)

- **Flow:**
  1. The 🔔 card (Today) registers `/sw.js` and, on a tap, asks permission and subscribes with `VAPID_PUBLIC_KEY`.
  2. `savePushSubscription` stores it in `push_subscriptions`.
  3. Vercel calls `/api/cron/nudge` at 00:00 and 01:00 UTC. Only the run in the **7 pm Central** hour sends, so 7 pm holds across DST. Hobby crons fire anywhere within the hour.
  4. For each subscribed user, `getNudgeForUser` builds the same message as the banner. No message means no push.
- **iPhone requirements:** iOS 16.4+, opened **from the Home Screen** (push doesn't exist in a Safari tab), and permission requested from a tap.
- **SEND TEST** sends tonight's nudge now, prefixed `[TEST]`, or a "reminders are on" note if nothing is left.
- **Push TTL is 3 h,** so an undelivered nudge is dropped rather than arriving overnight. Subscriptions the push service reports as 404/410 are deleted.
- **Testing locally:**
  - `curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3100/api/cron/nudge"` returns `skipped` outside 7 pm.
  - Scripts importing `server-only` modules need `NODE_OPTIONS=--conditions=react-server`.
- **Rotating VAPID keys** invalidates every subscription. Everyone would need to tap TURN ON again.

## Undo

- Each habit card keeps an undo stack for the current page visit, and the "↶ UNDO +25 (n)" button appears below the quick-add buttons.
- Undoing a quick-add sends `add −n` rather than "set to the old value", so it stays correct with rapid taps. Undoing a SET restores the previous total.
- The server clamps totals to 0..1,000,000. After a reload the stack is gone, and **SET** is the correction tool.

## Auth

- There are two gates:
  1. `src/proxy.ts` checks the cookie on every request except `/login` and static files.
  2. Every server page and action calls `requireUser()`, which returns the `userId`.
- The cookie `hq_session` is httpOnly, sameSite=lax, secure in production, and lasts 30 days.
- **Auto-login on autofill:** the login form submits by itself only when a password manager fills it (no typing `inputType`), once per page load. Typing still needs Enter or PRESS START. Chrome desktop may hide autofilled passwords until you interact with the page, so it might not fire there.
- **Reset your password:** change `SEED_PASSWORD` in `.env.local`, then run `npm run db:seed`.
- **Test logged-in pages without typing a password:** mint a cookie from the dev secret.

```bash
node --env-file=.env.local -e 'require("iron-session").sealData({userId:1},{password:process.env.SESSION_SECRET}).then(console.log)'
```

Set the output as the `hq_session` cookie for `localhost:3100`. This only works against the local server, because production uses a different secret.

## Theme

Palette tokens (usable as Tailwind classes like `bg-coin`, `text-berry`, `border-ink`):
`sky`, `sky-light`, `cloud`, `cream`, `grass`, `ground`, `coin`, `brick`, `berry`, `grape`, `ocean`, `lime`, `peach`, `ink`, `danger` (error text, ~10:1 on cream).

Animation classes: `anim-coin-pop`, `anim-level-up`, `anim-star-burst` (stepped timing for an 8-bit feel).

Component classes in `globals.css`:
- `pixel-card`: a cream block with a 4px ink border and a hard offset shadow
- `pixel-btn`: a coin-gold button that presses down on tap (min-height 44px)
- `pixel-input`: a white input with a 4px ink border

Fonts: `font-pixel` (Press Start 2P) for headings, numbers and the HUD; `font-body` (Nunito) for everything else. The look is an original 8-bit style; don't use Nintendo assets or names.

## Home screen app

- **iPhone:** open the site in Safari, then Share → **Add to Home Screen**. It launches full-screen (`appleWebApp.capable` + manifest `display: standalone`) with the pixel-star icon.
- **The home-screen app keeps its own cookies**, separate from Safari, so log in once there (autofill auto-login helps).
- The icons are drawn in code (`pixel-icon.tsx`), so edit the `STAR` grid to change the art. iOS caches home-screen icons, so remove and re-add the app to see a new one.
- `proxy.ts` excludes `icon`, `apple-icon` and `manifest.webmanifest`, because phones fetch them without a session.

## Testing

```bash
npm test          # Vitest (pure logic only — no DB)
npx tsc --noEmit  # type-check
npm run lint
```

## Deploying

Pushing or merging to `main` triggers an automatic production deploy on Vercel. PR branches get preview deploys. Preview deploys use the **same database**.

## Gotchas

- `vercel env pull` **overwrites** `.env.local`. Re-add your `SEED_*` lines afterward.
- Don't run `npm run build` while `npm run dev` is running. It overwrites `.next` and kills the dev server.
- Crons are in `vercel.json`, not `vercel.ts`. `@vercel/config` pulled in a high-severity `path-to-regexp` advisory just to type two lines.
- `npm audit` reports moderate advisories inside `drizzle-kit` (esbuild). It's a dev-only tool that is never deployed. Don't run `audit fix --force` (it downgrades drizzle-kit).
- `@types/node` is pinned to v24 to satisfy Vitest 5's peer range and match Vercel's Node 24 runtime.
- Files marked `"use server"` may only export async functions. Put shared constants elsewhere (see `nudge-cookie.ts`).
- `AGENTS.md` is rewritten by `next dev`. Commit it as-is.
- A route whose path starts with `icon`, `apple-icon` or `manifest.webmanifest` bypasses the login proxy (see the matcher). Don't name real pages that way.
- If you move or rename folders under `src/app` while `npm run dev` is running, restart it. Turbopack can stop watching the new folder and serve pages without their Tailwind classes, or return 500s.
