"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { PORTAL_HOME } from "@/lib/auth/guard";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/auth/rate-limit";
import { logger } from "@/lib/logger";

export type LoginState = { error?: string };

export async function loginAction(
  email: string,
  password: string,
): Promise<LoginState> {
  email = email.trim().toLowerCase();

  if (isRateLimited(email)) {
    logger.warn("login rate limited", { email });
    return {
      error: "Too many failed attempts. Please wait a few minutes and try again.",
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.active) {
    recordFailedAttempt(email);
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(email);
    logger.warn("failed login attempt", { email });
    return { error: "Invalid email or password." };
  }

  clearAttempts(email);
  await createSession(user.id);
  redirect(PORTAL_HOME[user.role]);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
