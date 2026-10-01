# Habit Quest — Nudges: Scope

**Date:** 2026-10-01 · **Status:** N1 (banner) built. N2 (push) is next.

**Katie's decisions:** banner from **5 pm**, push at **7 pm**, fire on **any unfinished evening**, **no morning** message.
**N2 timing note:** Hobby cron is UTC with no DST, so schedule **two** daily crons (`0 0 * * *` and `0 1 * * *`) and send only when the Central hour is 19. That keeps it at 7 pm all year.

## 1. Goal
Remind Katie to finish her habits **before a streak breaks**, without becoming noise. A nudge should only fire when it's useful: today is unfinished **and** a streak is at stake (or nothing is logged yet late in the day). A finished day means silence.

## 2. Shared core (needed by every option)
A pure, tested function in `src/lib/game/nudge.ts`:

```
nudgeFor({ dayHabits, gameState, nowCentral }) → { title, body } | null
```

- `null` if every habit is cleared, there's no active quest today, or it's before the nudge hour.
- Otherwise, pick the single most motivating message, for example:
  - "🔥 6-day perfect streak on the line. 2 habits left: Push-ups 40/100, Reading 0/20 min."
  - "🪙 Squats are 20 away from a 12-day streak."
  - "Nothing logged yet today. 5 quick wins for +75 XP."
- It reuses `getDayHabits` and `getGameState`, so there's no new game math.

## 3. Options

### A. In-app nudge banner (recommended first)
After the nudge hour, a dismissible pixel banner appears at the top of the Today screen with the `nudgeFor` message.
- **Effort:** about 1 hour. No new infrastructure, env vars or migrations.
- **Limit:** you only see it when you open the app.

### B. iPhone push notifications (recommended second)
A real notification on your lock screen in the evening.
- **Requires** (all verified):
  - iOS 16.4+, with the app **opened from the home screen**. Today's icon PR enables this.
  - Push is never available inside the Safari tab itself.
  - Permission must be requested from a tap, so add an "🔔 Turn on reminders" button.
- **Pieces:**
  - **Service worker** `public/sw.js`, which shows the notification. iOS 18.4+ also supports *Declarative Web Push*, which needs less JS, but a small service worker covers every version.
  - **VAPID keys**, stored as the env vars `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
  - **A new table** `push_subscriptions (id, user_id, endpoint unique, p256dh, auth, created_at)`, which means one Drizzle migration.
  - **Server actions** `subscribePush` and `unsubscribePush`.
  - **A cron route** `/api/cron/nudge`, protected by `CRON_SECRET`. For each subscribed user it runs `nudgeFor` and sends with the `web-push` npm package. It deletes subscriptions that come back expired (404/410).
  - **A `vercel.ts` cron entry**, scheduled daily at `0 0 * * *` UTC.
- **Hobby plan limits** (verified):
  - **Once per day**, and it fires **anywhere within the hour** (±59 min).
  - Cron runs in UTC with no daylight-saving adjustment. 00:00 UTC is **7–8 pm CDT** now and **6–7 pm CST** after Nov 1.
  - One evening nudge fits these limits. Multiple nudges a day would need the Pro plan.
- **Effort:** about half a day, plus testing on your real iPhone. Push can't be fully tested in the browser preview.
- **Gotcha:** the home-screen app has its **own login cookie**, separate from Safari, so you'll log in once there. The auto-login on autofill makes that quick.

### C. Email reminder (not recommended)
The same cron sends an email (Resend, like Oasis) when a nudge applies.
- **Pros:** works on any device and needs no service worker.
- **Cons:** needs a verified sender domain and `RESEND_API_KEY`, and an evening email is easy to ignore.
- Only worth it if push turns out to be unreliable on your phone.

## 4. Recommended plan
1. **Phase N1:** shared `nudgeFor` with tests, plus the in-app banner (Option A).
2. **Phase N2:** iPhone push (Option B), reusing `nudgeFor`. One migration, three env vars, one cron.

## 5. Out of scope
Multiple reminders per day (needs Pro), per-habit reminder times, a settings page (the 🔔 button toggling on/off is enough), SMS.

## 6. Questions for Katie
1. **Nudge time:** the banner can show any time after a set hour (I suggest 6 pm). The push lands around **7 pm** (DST shifts it to about 6 pm in winter). OK?
2. **What triggers it:** only when a streak is at risk, or **any** unfinished evening? I recommend *any unfinished evening with at least one habit left*, phrased around the streak when there is one.
3. **Morning "quest start" message** ("5 habits today, let's go")? I recommend no. It's noise on days you'd do them anyway.
