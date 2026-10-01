"use server";

import { and, eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { sendToUser } from "@/lib/push";
import { PUSH_HOUR } from "@/lib/push-logic";
import { getNudgeForUser } from "@/lib/queries/nudge";
import { pushSubscriptionSchema, type PushSubscriptionInput } from "@/lib/validation";

export async function savePushSubscription(input: PushSubscriptionInput): Promise<{ ok: true } | { error: string }> {
  const userId = await requireUser();
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "That subscription didn't look right. Try again." };
  const { endpoint, keys } = parsed.data;

  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh: keys.p256dh, auth: keys.auth } });
  return { ok: true };
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const userId = await requireUser();
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

/** Proves delivery on the real phone: sends tonight's nudge, or a "you're set" note if none applies. */
export async function sendTestPush(): Promise<{ sent: number }> {
  const userId = await requireUser();
  const nudge = await getNudgeForUser(userId, new Date(), PUSH_HOUR);
  const payload = nudge ?? {
    title: "🔔 Reminders are on!",
    body: "You'll get a nudge around 7 pm on days with habits left. Nothing left today. Nice work!",
  };
  const { sent } = await sendToUser(userId, { ...payload, title: `[TEST] ${payload.title}` });
  return { sent };
}
