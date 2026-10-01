import { unsealData } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, type SessionData } from "@/lib/auth/constants";

export async function proxy(request: NextRequest) {
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sealed
    ? await unsealData<SessionData>(sealed, { password: process.env.SESSION_SECRET! })
    : {};

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
