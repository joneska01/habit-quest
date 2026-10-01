import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { addDays, formatDayLabel, isIsoDate, todayInChicago } from "@/lib/dates";
import { getDayHabits } from "@/lib/queries/day";

import { HabitCard } from "./habit-card";

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

  const dayHabits = await getDayHabits(userId, date);
  const cleared = dayHabits.filter((h) => h.amount >= h.target).length;

  return (
    <div className="flex flex-col gap-5">
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
          <p className="pixel-card bg-coin px-4 py-2 text-center font-pixel text-xs">
            {cleared} / {dayHabits.length} CLEARED {cleared === dayHabits.length ? "🏆" : ""}
          </p>
          {dayHabits.map((habit) => (
            <HabitCard key={`${habit.habitId}-${date}`} habit={habit} date={date} />
          ))}
        </>
      )}
    </div>
  );
}
