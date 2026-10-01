import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { hourInChicago } from "@/lib/dates";
import { sendToUser } from "@/lib/push";
import { isPushHour } from "@/lib/push-logic";
import { getNudgeForUser } from "@/lib/queries/nudge";

// Called by two daily Vercel crons (vercel.json: 00:00 and 01:00 UTC). Only the run that
// lands in the 7 pm Central hour sends, which keeps 7 pm steady across daylight saving.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET not set" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const hour = hourInChicago(now);
  if (!isPushHour(hour)) return Response.json({ skipped: true, reason: "not the 7 pm Central hour", hour });

  const userIds = (await db.selectDistinct({ userId: pushSubscriptions.userId }).from(pushSubscriptions)).map((r) => r.userId);
  const results = [];
  for (const userId of userIds) {
    const nudge = await getNudgeForUser(userId, now);
    if (!nudge) {
      results.push({ userId, nudged: false });
      continue;
    }
    results.push({ userId, nudged: true, ...(await sendToUser(userId, nudge)) });
  }
  return Response.json({ hour, results });
}
