"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { habits, questHabits, quests } from "@/lib/db/schema";
import { questEndDate } from "@/lib/quests";
import { createHabitSchema, createQuestSchema, type CreateQuestInput } from "@/lib/validation";

export type FormState = { error?: string; createdAt?: number };

export async function createHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUser();

  const parsed = createHabitSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    defaultTarget: formData.get("defaultTarget") ?? "",
    color: formData.get("color"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the habit details." };

  const duplicate = await db.query.habits.findFirst({
    where: and(eq(habits.userId, userId), sql`lower(${habits.name}) = lower(${parsed.data.name})`),
    columns: { id: true },
  });
  if (duplicate) return { error: `You already have a habit called "${parsed.data.name}".` };

  await db.insert(habits).values({ ...parsed.data, userId });
  revalidatePath("/quests/new");
  return { createdAt: Date.now() };
}

export async function createQuest(input: CreateQuestInput): Promise<{ error: string }> {
  const userId = await requireUser();

  const parsed = createQuestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the quest details." };
  const { name, period, startDate, habits: picked } = parsed.data;

  const owned = await db
    .select({ id: habits.id })
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        eq(habits.archived, false),
        inArray(
          habits.id,
          picked.map((h) => h.habitId),
        ),
      ),
    );
  if (owned.length !== picked.length) return { error: "One of those habits wasn't found." };

  await db.transaction(async (tx) => {
    const [quest] = await tx
      .insert(quests)
      .values({ userId, name, period, startDate, endDate: questEndDate(period, startDate) })
      .returning({ id: quests.id });
    await tx.insert(questHabits).values(picked.map((h) => ({ questId: quest.id, ...h })));
  });

  revalidatePath("/");
  revalidatePath("/quests");
  redirect("/quests");
}

export async function deleteQuest(formData: FormData) {
  const userId = await requireUser();
  const questId = Number(formData.get("questId"));
  if (!Number.isInteger(questId)) return;

  // Logs belong to habits, not quests, so deleting a quest never deletes logged progress.
  await db.delete(quests).where(and(eq(quests.id, questId), eq(quests.userId, userId)));

  revalidatePath("/");
  revalidatePath("/quests");
}
