import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { addDays, formatDayLabel, hourInChicago, isIsoDate, todayInChicago } from "@/lib/dates";
import { nudgeFor } from "@/lib/game/nudge";
import { getDayHabits } from "@/lib/queries/day";
import { getGameState } from "@/lib/queries/game";

import { DayBanner } from "./day-banner";
import { HabitCard } from "./habit-card";
import { Hud } from "./hud";
import { NudgeBanner } from "./nudge-banner";
import { NUDGE_DISMISSED_COOKIE } from "./nudge-cookie";
import { ReminderToggle } from "./reminder-toggle";

function dayHref(date: string, today: string) {
  return date === today ? "/" : `/?date=${date}`;
}

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const userId = await requireUser();
  const today = todayInChicago();
  const { date: param } = await searchParams;

  // Past days only; today itself lives at the clean "/" URL.
  if (param !== undefined && (!isIsoDate(param) || param >= today)) redirect("/");
  const date = param ?? today;
  const isToday = date === today;

  const [dayHabits, { habitStreaks, ...player }] = await Promise.all([
    getDayHabits(userId, date),
    getGameState(userId, today),
  ]);
  const cleared = dayHabits.filter((h) => h.amount >= h.target).length;
  const dismissedFor = (await cookies()).get(NUDGE_DISMISSED_COOKIE)?.value;
  const nudge =
    isToday && dismissedFor !== today
      ? nudgeFor({ dayHabits, perfectStreak: player.perfectStreak, habitStreaks, hour: hourInChicago() })
      : null;

  return (
    <div className="flex flex-col gap-5">
      <Hud {...player} />
      {nudge && <NudgeBanner nudge={nudge} date={today} />}
      <header className="flex items-center justify-between gap-2">
        <Link href={dayHref(addDays(date, -1), today)} className="pixel-btn bg-cloud" aria-label="Previous day">
          ◀
        </Link>
        <div className="text-center">
          <h1 className="font-pixel text-base text-cloud [text-shadow:3px_3px_0_var(--color-ink)]">
            {isToday ? "TODAY" : "PAST DAY"}
          </h1>
          <p className="mt-1 font-bold">{formatDayLabel(date)}</p>
        </div>
        {isToday ? (
          <span className="w-[52px]" aria-hidden />
        ) : (
          <Link href={dayHref(addDays(date, 1), today)} className="pixel-btn bg-cloud" aria-label="Next day">
            ▶
          </Link>
        )}
      </header>

      {dayHabits.length === 0 ? (
        <div className="pixel-card flex flex-col items-center gap-4 p-6 text-center">
          <p className="font-pixel text-xs leading-relaxed">NO ACTIVE QUEST</p>
          <p>No habits are being tracked on this day.</p>
          <Link href="/quests/new" className="pixel-btn">
            START A QUEST ▶
          </Link>
        </div>
      ) : (
        <>
          <DayBanner key={date} cleared={cleared} total={dayHabits.length} />
          {dayHabits.map((habit) => (
            <HabitCard
              key={`${habit.habitId}-${date}`}
              habit={habit}
              date={date}
              streak={isToday ? (habitStreaks[habit.habitId] ?? 0) : 0}
            />
          ))}
        </>
      )}

      {isToday && process.env.VAPID_PUBLIC_KEY && <ReminderToggle vapidPublicKey={process.env.VAPID_PUBLIC_KEY} />}
    </div>
  );
}
