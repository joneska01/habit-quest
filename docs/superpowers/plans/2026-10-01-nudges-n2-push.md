# Nudges N2: 7 pm iPhone Push — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** At 7 pm Central, if habits are left, send the `nudgeFor` message as a push notification to Katie's home-screen app. Follows `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`.

**Architecture:**
- `public/sw.js` shows the notification.
- `ReminderToggle` (client) registers the service worker, subscribes on a tap, and saves the subscription through a server action into `push_subscriptions`.
- `/api/cron/nudge` (protected by `CRON_SECRET`) runs from two daily Vercel crons (00:00 and 01:00 UTC). It only sends when the Central hour is 19, so it's 7 pm in both CDT and CST.
- `lib/push.ts` sends with `web-push` and deletes subscriptions that come back gone (404/410).

## Decisions
- **The VAPID public key is passed from the server as a prop** (not `NEXT_PUBLIC_`), so there's one env var name everywhere.
- **One VAPID pair for all environments.** Local and production share a DB, and a subscription only works with the key pair that created it. The private key is *sensitive* in prod/preview.
- **VAPID subject** = `https://habit-quest-dusky.vercel.app`, the production URL, so no email is shared with push services.
- **Push TTL 3 h:** a nudge that can't be delivered by about 10 pm is dropped instead of arriving overnight.
- **"Send test" button:** the only way to prove delivery on the real iPhone. It sends the current nudge, or a friendly "reminders are on" message if nothing is left.
- **Proxy** excludes `sw.js` and `api/cron`. The cron is guarded by its secret instead of a session.

## Tasks
1. Install `web-push`, `@types/web-push` and `@vercel/config`.
2. **TDD:** `isPushHour`, `isGoneStatus`, `urlBase64ToUint8Array`, and the `pushSubscriptionSchema` Zod schema.
3. Schema: `push_subscriptions (id, user_id → users cascade, endpoint unique, p256dh, auth, created_at)`. Generate and **apply the migration before merge**.
4. `lib/push.ts`: `sendToUser(userId, payload)` → `{ sent, removed }`.
5. `lib/queries/nudge.ts`: `getNudgeForUser(userId, now)`, reusing `getDayHabits`, `getGameState` and `nudgeFor`.
6. Server actions: `savePushSubscription`, `deletePushSubscription`, `sendTestPush`.
7. `public/sw.js` plus the `next.config.ts` headers for it.
8. `ReminderToggle` on Today, with these states:
   - **unsupported:** "Add to Home Screen to get reminders"
   - **denied:** explain how to re-enable in iOS Settings
   - **off:** TURN ON
   - **on:** SEND TEST / TURN OFF
9. `/api/cron/nudge` route plus `vercel.ts` with the two crons.
10. Env vars through the CLI, values never printed: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
11. **Verify locally:** cron returns 401 without the secret, and "skipped" outside 7 pm. Subscribe and send a test with a **throwaway user** in the browser pane, if it supports push. Delete the test user afterward.
12. **Verify on Katie's iPhone after merge:** TURN ON, then SEND TEST, then a real 7 pm nudge.
