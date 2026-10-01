import Link from "next/link";

import { requireUser } from "@/lib/auth/session";

import { logout } from "./actions";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <>
      <nav className="mb-6 flex items-center gap-2">
        <Link href="/" className="pixel-btn flex-1 text-center">
          TODAY
        </Link>
        <Link href="/quests" className="pixel-btn flex-1 bg-grass text-center">
          QUESTS
        </Link>
        <form action={logout}>
          <button type="submit" className="pixel-btn bg-berry" aria-label="Log out" title="Log out">
            ⏻
          </button>
        </form>
      </nav>
      {children}
    </>
  );
}
