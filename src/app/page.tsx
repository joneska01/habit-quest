import { eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

import { logout } from "./actions";

export default async function HomePage() {
  const userId = await requireUser();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  return (
    <div className="pixel-card flex flex-col gap-6 p-6">
      <h1 className="font-pixel text-lg leading-relaxed">PLAYER 1: {user?.displayName.toUpperCase()}</h1>
      <p>Your quest log is loading in Phase 2. 🍄</p>
      <form action={logout}>
        <button type="submit" className="pixel-btn bg-berry">
          LOG OUT
        </button>
      </form>
    </div>
  );
}
