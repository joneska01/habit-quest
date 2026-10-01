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
| 2. Playable | Habit library, create quest, Today logging | Next |
| 3. Game layer | XP, levels, streaks, HUD, animations | — |
| 4. Endgame | Quest calendar/backfill, results screen, year stats | — |

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
| `SEED_EMAIL` | `.env.local` only | Your login email |
| `SEED_PASSWORD` | `.env.local` only, never committed | Your login password. Only its bcrypt hash is stored. |
| `SEED_DISPLAY_NAME` | `.env.local` only | Name shown in the app, e.g. "Katie" |

The Neon integration also adds `POSTGRES_*` / `PG*` variables. The app only uses `DATABASE_URL`.

## Project structure

```
src/
  app/
    layout.tsx          fonts, metadata, page column
    globals.css         @theme palette, sky/grass background, pixel-* classes
    page.tsx            temporary home (replaced by Today in Phase 2)
    actions.ts          logout server action
    login/              page, client form (useActionState), login server action
  lib/
    auth/
      constants.ts      cookie name + SessionData type (dependency-free, safe for proxy)
      password.ts       hashPassword / verifyPassword (+ .test.ts)
      session.ts        getSession(), requireUser() — server-only
    db/
      schema.ts         all tables + enums (single source of DB shape)
      client.ts         Drizzle client
  proxy.ts              redirects signed-out requests to /login
scripts/seed.ts         idempotent seed
drizzle/                generated SQL migrations (committed)
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

## Auth

- There are two gates:
  1. `src/proxy.ts` checks the cookie on every request except `/login` and static files.
  2. Every server page and action calls `requireUser()`, which returns the `userId`.
- The cookie `hq_session` is httpOnly, sameSite=lax, secure in production, and lasts 30 days.
- **Reset your password:** change `SEED_PASSWORD` in `.env.local`, then run `npm run db:seed`.
- **Test logged-in pages without typing a password:** mint a cookie from the dev secret.

```bash
node --env-file=.env.local -e 'require("iron-session").sealData({userId:1},{password:process.env.SESSION_SECRET}).then(console.log)'
```

Set the output as the `hq_session` cookie for `localhost:3100`. This only works against the local server, because production uses a different secret.

## Theme

Palette tokens (usable as Tailwind classes like `bg-coin`, `text-berry`, `border-ink`):
`sky`, `sky-light`, `cloud`, `cream`, `grass`, `ground`, `coin`, `brick`, `berry`, `grape`, `ocean`, `lime`, `peach`, `ink`.

Component classes in `globals.css`:
- `pixel-card`: a cream block with a 4px ink border and a hard offset shadow
- `pixel-btn`: a coin-gold button that presses down on tap (min-height 44px)
- `pixel-input`: a white input with a 4px ink border

Fonts: `font-pixel` (Press Start 2P) for headings, numbers and the HUD; `font-body` (Nunito) for everything else. The look is an original 8-bit style; don't use Nintendo assets or names.

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
- `npm audit` reports moderate advisories inside `drizzle-kit` (esbuild). It's a dev-only tool that is never deployed. Don't run `audit fix --force` (it downgrades drizzle-kit).
- `@types/node` is pinned to v24 to satisfy Vitest 5's peer range and match Vercel's Node 24 runtime.
- `AGENTS.md` is rewritten by `next dev`. Commit it as-is.
