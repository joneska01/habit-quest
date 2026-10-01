"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, requireUser } from "@/lib/auth/session";
import { todayInChicago } from "@/lib/dates";
import { db } from "@/lib/db/client";
import { habits, logs } from "@/lib/db/schema";
import { logProgressSchema, MAX_AMOUNT, type LogProgressInput } from "@/lib/validation";

export type ActionResult = { ok: true } | { error: string };

export async function logProgress(input: LogProgressInput): Promise<ActionResult> {
  const userId = await requireUser();

  const parsed = logProgressSchema.safeParse(input);
  if (!parsed.success) return { error: "That amount doesn't look right." };
  const { habitId, date, mode, amount } = parsed.data;

  if (date > todayInChicago()) return { error: "No logging the future — nice try! ⏳" };

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, userId), eq(habits.archived, false)),
    columns: { id: true },
  });
  if (!habit) return { error: "Habit not found." };

  await db
    .insert(logs)
    .values({ userId, habitId, date, amount: Math.max(0, amount) })
    .onConflictDoUpdate({
      target: [logs.habitId, logs.date],
      set: {
        // Clamp to 0..MAX so an undo can never go negative.
        amount: mode === "add" ? sql`greatest(0, least(${logs.amount} + ${amount}, ${MAX_AMOUNT}))` : amount,
        updatedAt: sql`now()`,
      },
    });

  revalidatePath("/");
  return { ok: true };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
