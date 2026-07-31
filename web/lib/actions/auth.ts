"use server";

import { eq, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/auth/password";
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

  // Always run the password hash comparison, even for a nonexistent user,
  // so response timing can't reveal whether the account exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.active || !valid) {
    recordFailedAttempt(email);
    logger.warn("failed login attempt", { email });
    return { error: "Invalid email or password." };
  }

  clearAttempts(email);
  logger.info("successful login", { userId: user.id, email, role: user.role });

  // Housekeeping: clear this user's own expired sessions on login.
  await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()));

  await createSession(user.id);
  redirect(PORTAL_HOME[user.role]);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
