import "server-only";

import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";

import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { isGoneStatus } from "@/lib/push-logic";

// Push services use this to contact the sender; the production URL avoids sharing an email.
const VAPID_SUBJECT = "https://habit-quest-dusky.vercel.app";
// Drop a nudge that can't be delivered by ~10 pm rather than buzzing overnight.
const TTL_SECONDS = 3 * 60 * 60;

export type PushPayload = { title: string; body: string; url?: string };

let configured = false;
function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set");
  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
  configured = true;
}

/** Send to every device the user subscribed; prune ones the push service says are gone. */
export async function sendToUser(userId: number, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  configure();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  const body = JSON.stringify({ url: "/", ...payload });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
        TTL: TTL_SECONDS,
      }),
    ),
  );

  const goneIds = results.flatMap((r, i) =>
    r.status === "rejected" && isGoneStatus((r.reason as { statusCode?: number }).statusCode) ? [subs[i].id] : [],
  );
  if (goneIds.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, goneIds));

  for (const r of results) {
    if (r.status === "rejected" && !isGoneStatus((r.reason as { statusCode?: number }).statusCode)) {
      console.error("push failed", (r.reason as { statusCode?: number }).statusCode, (r.reason as Error).message);
    }
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length, removed: goneIds.length };
}
