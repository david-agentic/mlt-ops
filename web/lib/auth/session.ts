import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, resellers } from "@/db/schema";
import { config } from "@/lib/config";

const SESSION_COOKIE_NAME = config.sessionCookieName;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
// Renew (extend expiry + refresh cookie) once less than half the session's
// lifetime remains, instead of on every single request, to avoid a DB write
// on every page load.
const RENEW_THRESHOLD_MS = SESSION_DURATION_MS / 2;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "finance" | "shipping" | "reseller";
  resellerId: string | null;
  mustChangePassword: boolean;
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  await setSessionCookie(token, expiresAt);
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function destroyAllSessionsForUser(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Destroys every session for a user except the current browser's one —
 * used by self-service change-password, so the user isn't logged out of
 * the very request that changed their password. */
export async function destroyOtherSessionsForUser(userId: string) {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!currentToken) {
    await destroyAllSessionsForUser(userId);
    return;
  }
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentToken)));
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      resellerId: users.resellerId,
      active: users.active,
      deletedAt: users.deletedAt,
      mustChangePassword: users.mustChangePassword,
      resellerActive: resellers.active,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(resellers, eq(users.resellerId, resellers.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt < new Date() || !row.active || row.deletedAt) return null;
  // A reseller-role user whose company account has been deactivated loses
  // access even if their individual login is still marked active.
  if (row.role === "reseller" && row.resellerActive === false) return null;

  const remainingMs = row.expiresAt.getTime() - Date.now();
  if (remainingMs < RENEW_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiresAt, lastUsedAt: new Date() })
      .where(eq(sessions.id, token));
    await setSessionCookie(token, newExpiresAt);
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    resellerId: row.resellerId,
    mustChangePassword: row.mustChangePassword,
  };
}
