"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  // Echo the email back so React's post-submit form reset doesn't make you retype it.
  const invalid = { error: "Invalid email or password", email };

  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return invalid;

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid;

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/");
}
