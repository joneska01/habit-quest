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
