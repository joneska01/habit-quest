# Habit Quest — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed, login-protected Next.js app with the full database schema, a seeded user (Katie), her five habits and the October 2026 quest, plus the bright 8-bit base theme. This is everything Phase 2 needs to start logging.

**Architecture:** Next.js 16 App Router. The Drizzle ORM talks to Neon Postgres through the `postgres` driver, the same setup as Oasis. iron-session stores `{ userId }` in an encrypted cookie. `src/proxy.ts` redirects signed-out visitors to `/login`, and server pages and actions re-check the session through `requireUser()`. Password hashing lives in a tiny pure module that is covered by Vitest.

**Tech Stack:** next 16.3, react 19.3, tailwindcss 4.3, drizzle-orm 0.45 / drizzle-kit 0.31, postgres 3.4, iron-session 9, bcryptjs 3, zod 4, vitest 5, tsx 4.

**Spec:** `docs/superpowers/specs/2026-10-01-habit-quest-design.md`

---

## File map (created in this phase)

| File | Responsibility |
|---|---|
| `src/lib/db/schema.ts` | All 5 tables + enums (single source of the DB shape) |
| `src/lib/db/client.ts` | Drizzle client singleton |
| `drizzle.config.ts` | drizzle-kit config |
| `src/lib/auth/password.ts` (+ `.test.ts`) | `hashPassword` / `verifyPassword` (pure, tested) |
| `src/lib/auth/session.ts` | iron-session options, `getSession()`, `requireUser()` |
| `src/proxy.ts` | Redirect signed-out requests to `/login` |
| `src/app/login/page.tsx`, `login-form.tsx`, `actions.ts` | Login UI + server action |
| `src/app/actions.ts` | `logout` server action |
| `src/app/page.tsx` | Temporary home (welcome + logout); replaced by Today in Phase 2 |
| `src/app/layout.tsx`, `src/app/globals.css` | Fonts, `@theme` palette, sky background, pixel utility classes |
| `scripts/seed.ts` | Idempotent seed: user, 5 habits, October quest |
| `.env.example` | Documents required env vars (no values) |
| `DEVELOPER_GUIDE.md` | Setup, architecture, deploy and migration steps |

---

### Task 1: Push the spec to GitHub and create the feature branch

- [ ] **Step 1: Create the private GitHub repo and push `main`** (it currently holds just the spec commit)

```bash
gh repo create joneska01/habit-quest --private --source=. --remote=origin --push
```
Expected: `✓ Created repository joneska01/habit-quest on GitHub` and the push succeeds. If the push hangs: run `gh auth setup-git` and retry `git push -u origin main`.

- [ ] **Step 2: Create the feature branch**

```bash
git checkout -b phase-1-foundation
```

---

### Task 2: Scaffold Next.js

The project folder isn't empty (it has `.git` and `docs/`), so scaffold into the scratchpad and copy the result over.

- [ ] **Step 1: Scaffold**

```bash
cd "$SCRATCHPAD" && npx create-next-app@latest hq-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Copy into the project, skipping the scaffold's `.git` and `node_modules`, then install**

```bash
rsync -a --exclude .git --exclude node_modules "$SCRATCHPAD/hq-scaffold/" ~/Development/habit-quest/ && cd ~/Development/habit-quest && npm install
```

- [ ] **Step 3: Read the Next 16 docs this phase depends on** (required by `AGENTS.md`). Note anything that contradicts this plan before continuing.

```bash
ls node_modules/next/dist/docs/
grep -ril "proxy" node_modules/next/dist/docs/ | head
```
Read the guides on **proxy** (file name, export name, `config.matcher`), **Server Actions / forms** (`useActionState`), **cookies()** (async) and **next/font**. If the proxy export name differs from `export async function proxy(request)`, follow the docs.

- [ ] **Step 4: Confirm it runs.** Start the dev server through `.claude/launch.json` (create it with name `dev`, `npm run dev`, port 3000) and load `/`. Expected: the default Next.js page.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Scaffold Next.js 16 app with Tailwind v4 and TypeScript"
```

---

### Task 3: Dependencies, scripts, Vitest

**Files:** Modify `package.json`; Create `vitest.config.ts`, `.env.example`; Modify `.gitignore`

- [ ] **Step 1: Install packages**

```bash
npm install drizzle-orm postgres iron-session bcryptjs zod
npm install -D drizzle-kit vitest tsx
```

- [ ] **Step 2: Add scripts to `package.json`** (merge into the existing `"scripts"` block)

```json
"test": "vitest run",
"db:generate": "node --env-file=.env.local node_modules/.bin/drizzle-kit generate",
"db:migrate": "node --env-file=.env.local node_modules/.bin/drizzle-kit migrate",
"db:seed": "node --env-file=.env.local node_modules/.bin/tsx scripts/seed.ts"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Create `.env.example`**

```bash
# Pulled from Vercel (Neon integration) via `vercel env pull .env.local`
DATABASE_URL=
# 32+ random chars; set in Vercel for all environments
SESSION_SECRET=
# Local only — used by `npm run db:seed`. Never commit real values.
SEED_EMAIL=
SEED_PASSWORD=
SEED_DISPLAY_NAME=Katie
```

- [ ] **Step 5: Make sure `.gitignore` ignores env files but keeps the example.** The scaffold already has `.env*`. Add this line after it:

```
!.env.example
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add Drizzle, iron-session, bcryptjs, Zod, Vitest and db scripts"
```

---

### Task 4: Password helpers (TDD)

**Files:** Create `src/lib/auth/password.ts`, `src/lib/auth/password.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/auth/password.test.ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
});
```

- [ ] **Step 2: Run it.** `npm test` should fail with: Cannot find module './password'

- [ ] **Step 3: Implement**

```ts
// src/lib/auth/password.ts
import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run it.** `npm test` should show 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth && git commit -m "Add bcrypt password hash/verify helpers with tests"
```

---

### Task 5: Database schema and client

**Files:** Create `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create `src/lib/db/schema.ts`**

```ts
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const habitUnit = pgEnum("habit_unit", ["count", "minutes", "check"]);
export const questPeriod = pgEnum("quest_period", ["week", "month"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const habits = pgTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unit: habitUnit("unit").notNull(),
    defaultTarget: integer("default_target").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("habits_user_name_unique").on(t.userId, t.name),
    check("habits_default_target_positive", sql`${t.defaultTarget} > 0`),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    period: questPeriod("period").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("quests_dates_ordered", sql`${t.endDate} >= ${t.startDate}`)],
);

export const questHabits = pgTable(
  "quest_habits",
  {
    id: serial("id").primaryKey(),
    questId: integer("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
    habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    dailyTarget: integer("daily_target").notNull(),
  },
  (t) => [
    unique("quest_habits_quest_habit_unique").on(t.questId, t.habitId),
    check("quest_habits_target_positive", sql`${t.dailyTarget} > 0`),
  ],
);

export const logs = pgTable(
  "logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    amount: integer("amount").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("logs_habit_date_unique").on(t.habitId, t.date),
    check("logs_amount_nonnegative", sql`${t.amount} >= 0`),
  ],
);
```

(One small addition to the spec: `habits_user_name_unique` keeps duplicate habit names out of your library and makes the seed idempotent.)

- [ ] **Step 2: Create `src/lib/db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(postgres(connectionString), { schema });
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Type-check.** `npx tsc --noEmit` should print no errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add Drizzle schema for users, habits, quests, quest_habits and logs"
```

---

### Task 6: Vercel project, Neon database and secrets (🧑 Katie does the dashboard steps)

- [ ] **Step 1: Upgrade the Vercel CLI** (54 → latest; ask Katie first)

```bash
npm i -g vercel@latest
```

- [ ] **Step 2: Link the folder to a new Vercel project**

```bash
vercel link --yes --project habit-quest
```
Expected: `Linked to joneska01/habit-quest` and a `.vercel/` folder appears (it's git-ignored).

- [ ] **Step 3: 🧑 Katie connects Git and creates the database in the dashboard**
  1. Go to vercel.com, open the **habit-quest** project, then **Settings → Git**, and connect the `joneska01/habit-quest` repo so pushes to `main` deploy.
  2. Open the **Storage** tab, click **Create Database**, choose **Neon** (Serverless Postgres), then **Continue**.
  3. Pick the region closest to you (**US East / Washington, D.C. `iad1`** is fine), keep the Free plan, and name it `habit-quest-db`.
  4. When it asks which environments to connect, keep **Development, Preview, Production** all checked, then click **Connect**. This adds `DATABASE_URL` to the project.

- [ ] **Step 4: Add `SESSION_SECRET` to every environment without printing it.** First check the syntax with `vercel env add --help`. If preview prompts for a branch, follow the help output for "all preview branches".

```bash
S=$(openssl rand -base64 32); for e in production preview development; do printf %s "$S" | vercel env add SESSION_SECRET "$e"; done; unset S
```

- [ ] **Step 5: Pull the env vars locally**

```bash
vercel env pull .env.local
```
Then check that the keys exist **without showing their values**:
```bash
cut -d= -f1 .env.local | grep -E '^(DATABASE_URL|SESSION_SECRET)$'
```
Expected output: both key names.

- [ ] **Step 6: 🧑 Katie adds her seed login to `.env.local`.** Open `.env.local` in the editor and append three lines with her real values (Claude never sees or types the password):
```
SEED_EMAIL=<your email>
SEED_PASSWORD=<pick a strong password>
SEED_DISPLAY_NAME=Katie
```
Note: `vercel env pull` overwrites `.env.local`, so re-add these lines if you pull again. The Developer Guide says the same.

---

### Task 7: Generate and apply the first migration

- [ ] **Step 1: Generate**

```bash
npm run db:generate
```
Expected: `drizzle/0000_<name>.sql` containing `CREATE TYPE "public"."habit_unit"`, the 5 `CREATE TABLE`s, the unique constraints and the checks. Read the SQL and confirm it.

- [ ] **Step 2: Apply** (this runs against the Neon database)

```bash
npm run db:migrate
```
Expected: `[✓] migrations applied successfully!`

- [ ] **Step 3: Commit**

```bash
git add drizzle && git commit -m "Add initial database migration"
```

---

### Task 8: Seed script

**Files:** Create `scripts/seed.ts`

- [ ] **Step 1: Create `scripts/seed.ts`**

```ts
import { and, eq } from "drizzle-orm";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db/client";
import { habits, questHabits, quests, users } from "../src/lib/db/schema";

const STARTER_HABITS = [
  { name: "Squats", unit: "count", defaultTarget: 100, color: "brick", icon: "🦵" },
  { name: "Push-ups", unit: "count", defaultTarget: 100, color: "berry", icon: "💪" },
  { name: "Crunches", unit: "count", defaultTarget: 100, color: "grape", icon: "🌀" },
  { name: "Steps", unit: "count", defaultTarget: 10000, color: "grass", icon: "👟" },
  { name: "Reading", unit: "minutes", defaultTarget: 20, color: "ocean", icon: "📚" },
] as const;

const OCTOBER = { name: "October 2026", period: "month", startDate: "2026-10-01", endDate: "2026-10-31" } as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env.local`);
  return value;
}

async function main() {
  const email = requireEnv("SEED_EMAIL").trim().toLowerCase();
  const passwordHash = await hashPassword(requireEnv("SEED_PASSWORD"));
  const displayName = process.env.SEED_DISPLAY_NAME ?? "Player 1";

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash, displayName } })
    .returning();

  const seededHabits = [];
  for (const h of STARTER_HABITS) {
    const [row] = await db
      .insert(habits)
      .values({ ...h, userId: user.id })
      .onConflictDoUpdate({ target: [habits.userId, habits.name], set: { archived: false } })
      .returning();
    seededHabits.push(row);
  }

  let quest = await db.query.quests.findFirst({
    where: and(eq(quests.userId, user.id), eq(quests.name, OCTOBER.name)),
  });
  if (!quest) {
    [quest] = await db.insert(quests).values({ ...OCTOBER, userId: user.id }).returning();
  }

  const questId = quest.id; // const so the narrowing survives into the map callback
  await db
    .insert(questHabits)
    .values(seededHabits.map((h) => ({ questId, habitId: h.id, dailyTarget: h.defaultTarget })))
    .onConflictDoNothing();

  console.log(`Seeded user #${user.id}, ${seededHabits.length} habits, quest "${quest.name}" (#${quest.id}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run it twice** to prove it's idempotent

```bash
npm run db:seed && npm run db:seed
```
Expected, both times, with the same ids: `Seeded user #1, 5 habits, quest "October 2026" (#1).`

- [ ] **Step 3: Commit**

```bash
git add scripts && git commit -m "Add idempotent seed for user, starter habits and October quest"
```

---

### Task 9: Session helpers and proxy

**Files:** Create `src/lib/auth/session.ts`, `src/proxy.ts`

- [ ] **Step 1: Check the iron-session v9 API** before writing code: `cat node_modules/iron-session/README.md | head -120`. Confirm that `getIronSession(cookieStore, options)` and `unsealData(sealed, { password })` exist. If the names changed, adjust Steps 2–3.

- [ ] **Step 2: Create `src/lib/auth/session.ts`**

```ts
import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionData = { userId?: number };

export const SESSION_COOKIE = "hq_session";

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return {
    password,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days — personal app, stay logged in on the phone
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/** Use in every server page/action that needs a user. Proxy is the first gate; this is the second. */
export async function requireUser(): Promise<number> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return session.userId;
}
```

Run `npm install server-only` if the scaffold doesn't already include it.

- [ ] **Step 3: Create `src/proxy.ts`** (use the export name confirmed in Task 2 Step 3)

```ts
import { unsealData } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, type SessionData } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sealed
    ? await unsealData<SessionData>(sealed, { password: process.env.SESSION_SECRET! })
    : {};

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
```

`proxy.ts` imports from `session.ts`, which is marked `server-only` and also imports `next/headers`. If the build complains, move `SESSION_COOKIE` and `SessionData` into a new `src/lib/auth/constants.ts` and import them from there in both files.

- [ ] **Step 4: Type-check.** `npx tsc --noEmit` should show no errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add iron-session helpers and proxy auth gate"
```

---

### Task 10: Bright 8-bit base theme

**Files:** Modify `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-sky: #6ec6ff;
  --color-sky-light: #b9e4ff;
  --color-cloud: #ffffff;
  --color-cream: #fff8e7;
  --color-grass: #4cc552;
  --color-ground: #c8763a;
  --color-coin: #ffc93c;
  --color-brick: #e86a33;
  --color-berry: #ff5da2;
  --color-grape: #9b5de5;
  --color-ocean: #00bbf9;
  --color-lime: #b8e04a;
  --color-peach: #ffb385;
  --color-ink: #2b2d42;
}

@theme inline {
  --font-pixel: var(--font-press-start);
  --font-body: var(--font-nunito);
}

body {
  min-height: 100dvh;
  color: var(--color-ink);
  font-family: var(--font-body), system-ui, sans-serif;
  background:
    /* grass strip */
    linear-gradient(var(--color-grass), var(--color-grass)) bottom / 100% 24px no-repeat,
    /* ground under it */
    linear-gradient(var(--color-ground), var(--color-ground)) bottom / 100% 12px no-repeat,
    linear-gradient(180deg, var(--color-sky) 0%, var(--color-sky-light) 100%);
  background-attachment: fixed;
}

@layer components {
  .pixel-card {
    background: var(--color-cream);
    border: 4px solid var(--color-ink);
    box-shadow: 6px 6px 0 var(--color-ink);
  }

  .pixel-btn {
    font-family: var(--font-pixel);
    font-size: 0.75rem;
    min-height: 44px;
    padding: 0.75rem 1rem;
    background: var(--color-coin);
    border: 4px solid var(--color-ink);
    box-shadow: 4px 4px 0 var(--color-ink);
    transition: transform 60ms, box-shadow 60ms;
  }
  .pixel-btn:active {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 var(--color-ink);
  }

  .pixel-input {
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    background: var(--color-cloud);
    border: 4px solid var(--color-ink);
  }
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";

import "./globals.css";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Habit Quest",
  description: "Level up your daily habits.",
};

export const viewport: Viewport = {
  themeColor: "#6ec6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${nunito.variable}`}>
      <body>
        <main className="mx-auto w-full max-w-md px-4 pt-8 pb-16">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css && git commit -m "Add bright 8-bit theme tokens, fonts and pixel UI classes"
```

---

### Task 11: Login, logout and temporary home page

**Files:** Create `src/app/login/actions.ts`, `src/app/login/login-form.tsx`, `src/app/login/page.tsx`, `src/app/actions.ts`; Replace `src/app/page.tsx`

- [ ] **Step 1: `src/app/login/actions.ts`**

```ts
"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string };

const INVALID = { error: "Invalid email or password" };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return INVALID;

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return INVALID;

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/");
}
```

- [ ] **Step 2: `src/app/login/login-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";

import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-bold">
        Email
        <input name="email" type="email" autoComplete="email" required className="pixel-input" />
      </label>
      <label className="flex flex-col gap-1 font-bold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="pixel-input" />
      </label>
      {state.error && (
        <p role="alert" className="font-bold text-brick">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="pixel-btn">
        {pending ? "LOADING..." : "▶ PRESS START"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: `src/app/login/page.tsx`**

```tsx
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-center font-pixel text-2xl leading-relaxed text-cloud [text-shadow:4px_4px_0_var(--color-ink)]">
        HABIT
        <br />
        QUEST
      </h1>
      <div className="pixel-card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/app/actions.ts`** (logout)

```ts
"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
```

- [ ] **Step 5: Replace `src/app/page.tsx`** (temporary; Phase 2 replaces it with the Today screen)

```tsx
import { eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

import { logout } from "./actions";

export default async function HomePage() {
  const userId = await requireUser();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  return (
    <div className="pixel-card flex flex-col gap-6 p-6">
      <h1 className="font-pixel text-lg leading-relaxed">PLAYER 1: {user?.displayName.toUpperCase()}</h1>
      <p>Your quest log is loading in Phase 2. 🍄</p>
      <form action={logout}>
        <button type="submit" className="pixel-btn bg-berry">
          LOG OUT
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Type-check and lint.** Both `npx tsc --noEmit && npm run lint` should be clean.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Add login, logout and temporary home page"
```

---

### Task 12: Verify in the browser (proof, not claims)

Never type Katie's real password. Test the logged-in state by minting a cookie from `SESSION_SECRET` instead.

- [ ] **Step 1:** Start the dev server (`preview_start` name `dev`) and load `/`. Expected: redirect to `/login`, showing the pixel title, the cream card and the sky/grass background. Take a screenshot.
- [ ] **Step 2: Bad login.** Enter `nobody@example.com` / `wrong`. Expected: "Invalid email or password" and no redirect.
- [ ] **Step 3: Mint a session cookie** in the scratchpad, without printing the secret:

```bash
node --env-file=.env.local -e 'require("iron-session").sealData({userId:1},{password:process.env.SESSION_SECRET}).then(s=>require("fs").writeFileSync(process.argv[1],s))' "$SCRATCHPAD/cookie.txt"
```
Set the cookie `hq_session` in the browser pane (via `javascript_tool`: `document.cookie = "hq_session=<value>; path=/"`), then reload `/`. Expected: "PLAYER 1: KATIE".
- [ ] **Step 4: Logout.** Click LOG OUT. Expected: back to `/login`. Then load `/` again. Expected: redirected to `/login`.
- [ ] **Step 5:** Check the phone layout with `resize_window` preset `mobile` and take a screenshot. Check `read_console_messages` for errors.
- [ ] **Step 6:** Delete `$SCRATCHPAD/cookie.txt`.

---

### Task 13: Developer Guide, PR

**Files:** Create `DEVELOPER_GUIDE.md`; Replace `README.md`

- [ ] **Step 1: Write `DEVELOPER_GUIDE.md`** with these sections, filled in with this phase's real details:
  - **Overview:** what the app is, with a link to the spec
  - **Stack:** versions from `package.json`
  - **Local setup:** clone, `npm install`, `vercel link`, `vercel env pull .env.local`, re-add the `SEED_*` lines, `npm run db:migrate`, `npm run db:seed`, `npm run dev`
  - **Environment variables:** a table of `DATABASE_URL`, `SESSION_SECRET`, `SEED_EMAIL`, `SEED_PASSWORD` and `SEED_DISPLAY_NAME`, showing where each lives (Vercel vs local only)
  - **Project structure:** the file map from this plan
  - **Database & migrations:** edit `schema.ts`, run `npm run db:generate`, review the SQL, run `npm run db:migrate` **before merging** (Vercel doesn't run migrations). Note that local and production share one Neon database.
  - **Auth:** the users table plus iron-session, the two gates (proxy + `requireUser()`), how to reset the password (edit `SEED_PASSWORD` and re-run the seed), how to mint a test cookie
  - **Theme:** the palette tokens and the `pixel-card`, `pixel-btn` and `pixel-input` classes
  - **Testing:** `npm test`
  - **Deploying:** a push or merge to `main` triggers an automatic Vercel deploy
  - **Gotchas:** `vercel env pull` overwrites `.env.local`; don't run `npm run build` while `npm run dev` is running

- [ ] **Step 2: Replace `README.md`** with a 5-line summary that points to `DEVELOPER_GUIDE.md`.

- [ ] **Step 3: Final checks.** `npm test && npx tsc --noEmit && npm run lint` should all pass. Stop the dev server, run `npm run build` (expected: success), then restart dev if needed.

- [ ] **Step 4: Commit, push, open the PR**

```bash
git add -A && git commit -m "Add Developer Guide and README"
git push -u origin phase-1-foundation
gh pr create --base main --title "Phase 1: Foundation — schema, auth, seed, 8-bit theme" --body "<summary + test proof + post-merge steps>"
```
The PR body lists the post-merge steps: the migration has already been applied to Neon, the env vars are already set in Vercel, and after merging, confirm the production deploy and log in on your phone.

---

## Phase 1 exit checklist
- [ ] Repo `joneska01/habit-quest` is private, and the PR is open into `main`
- [ ] Neon is connected; `DATABASE_URL` and `SESSION_SECRET` are set in all Vercel environments
- [ ] Migration applied; seed run (user, 5 habits, October 2026 quest)
- [ ] Unauthenticated → `/login`; bad login rejected; minted session → home; logout works
- [ ] `npm test`, `tsc`, `lint` and `build` are green, with screenshots shared
- [ ] Developer Guide written
