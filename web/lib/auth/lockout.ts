import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

// Persisted on the user row (not in-memory) so it's correct regardless of
// how many Workers isolates this app is running behind — an in-memory
// counter would silently stop working under Cloudflare's stateless,
// possibly-multi-isolate execution model.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type LockoutStatus =
  | { locked: false }
  | { locked: true; retryAfterMinutes: number };

export function checkLockout(user: Pick<User, "lockedUntil">): LockoutStatus {
  if (!user.lockedUntil || user.lockedUntil.getTime() <= Date.now()) {
    return { locked: false };
  }
  const retryAfterMinutes = Math.ceil(
    (user.lockedUntil.getTime() - Date.now()) / 60000,
  );
  return { locked: true, retryAfterMinutes };
}

export async function recordFailedAttempt(
  userId: string,
): Promise<{ lockedNow: boolean }> {
  const [updated] = await db
    .update(users)
    .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1` })
    .where(eq(users.id, userId))
    .returning({ failedLoginAttempts: users.failedLoginAttempts });

  if (updated && updated.failedLoginAttempts >= MAX_ATTEMPTS) {
    await db
      .update(users)
      .set({ lockedUntil: new Date(Date.now() + LOCKOUT_MS) })
      .where(eq(users.id, userId));
    return { lockedNow: true };
  }
  return { lockedNow: false };
}

export async function clearLockout(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId));
}
