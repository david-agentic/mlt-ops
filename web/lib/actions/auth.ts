"use server";

import { eq, lt, and, isNull, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, sessions, passwordResetTokens, invitations } from "@/db/schema";
import {
  verifyPassword,
  hashPassword,
  DUMMY_PASSWORD_HASH,
  generateToken,
  hashToken,
} from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  destroyAllSessionsForUser,
  destroyOtherSessionsForUser,
  getCurrentUser,
} from "@/lib/auth/session";
import { PORTAL_HOME, requireUser } from "@/lib/auth/guard";
import { checkLockout, recordFailedAttempt, clearLockout } from "@/lib/auth/lockout";
import { passwordSchema } from "@/lib/validation/password";
import { sendPasswordResetEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { logAudit } from "@/lib/actions/audit";

const RESET_TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes

export type LoginState = { error?: string };

export async function loginAction(
  email: string,
  password: string,
): Promise<LoginState> {
  email = email.trim().toLowerCase();
  let redirectTo: string | null = null;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always run the password hash comparison, even for a nonexistent user,
    // so response timing can't reveal whether the account exists.
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (user) {
      const lockout = checkLockout(user);
      if (lockout.locked) {
        logger.warn("login attempt while locked out", { email, userId: user.id });
        return {
          error: `Too many failed attempts. Try again in ${lockout.retryAfterMinutes} minute${lockout.retryAfterMinutes === 1 ? "" : "s"}.`,
        };
      }
    }

    if (!user || !user.active || user.deletedAt || !valid) {
      if (user) {
        const { lockedNow } = await recordFailedAttempt(user.id);
        await logAudit({
          targetUserId: user.id,
          action: lockedNow ? "login_locked_out" : "login_failed",
        });
      }
      logger.warn("failed login attempt", { email });
      return { error: "Invalid email or password." };
    }

    await clearLockout(user.id);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await logAudit({ actorUserId: user.id, targetUserId: user.id, action: "login_success" });
    logger.info("successful login", { userId: user.id, email, role: user.role });

    // Housekeeping: clear expired sessions system-wide on login.
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

    await createSession(user.id);
    redirectTo = PORTAL_HOME[user.role];
  } catch (err) {
    logger.error("login action threw an unexpected error", {
      email,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return { error: "Something went wrong. Please try again." };
  }

  redirect(redirectTo);
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await logAudit({ actorUserId: user.id, targetUserId: user.id, action: "logout" });
  }
  await destroySession();
  redirect("/login");
}

export type ForgotPasswordState = { message?: string; error?: string };

export async function requestPasswordReset(
  email: string,
): Promise<ForgotPasswordState> {
  email = email.trim().toLowerCase();
  const genericMessage =
    "If an account exists for that email, we've sent password reset instructions.";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user && user.active && !user.deletedAt) {
    const rawToken = generateToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    await logAudit({ targetUserId: user.id, action: "password_reset_requested" });
    const link = `${config.appUrl}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, link);
  }

  // Never reveal whether the email exists — same message either way.
  return { message: genericMessage };
}

export type ResetPasswordState = { error?: string; success?: boolean };

export async function resetPasswordAction(
  rawToken: string,
  newPassword: string,
): Promise<ResetPasswordState> {
  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const tokenHash = hashToken(rawToken);
  const [tokenRow] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!tokenRow) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date(), mustChangePassword: false })
    .where(eq(users.id, tokenRow.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenRow.id));
  await destroyAllSessionsForUser(tokenRow.userId);
  await logAudit({ targetUserId: tokenRow.userId, action: "password_reset_completed" });

  return { success: true };
}

export type AcceptInvitationState = { error?: string; success?: boolean };

export async function acceptInvitationAction(
  rawToken: string,
  newPassword: string,
): Promise<AcceptInvitationState> {
  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const tokenHash = hashToken(rawToken);
  const [invitationRow] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, tokenHash),
        isNull(invitations.usedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!invitationRow) {
    return { error: "This invitation link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date(), mustChangePassword: false })
    .where(eq(users.id, invitationRow.userId));
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, invitationRow.id));
  await logAudit({ targetUserId: invitationRow.userId, action: "invitation_accepted" });

  return { success: true };
}

export type ChangePasswordState = { error?: string; success?: boolean };

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordState> {
  const sessionUser = await requireUser();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);
  if (!user) return { error: "User not found." };

  const currentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentValid) {
    return { error: "Current password is incorrect." };
  }

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date(), mustChangePassword: false })
    .where(eq(users.id, user.id));
  await destroyOtherSessionsForUser(user.id);
  await logAudit({
    actorUserId: user.id,
    targetUserId: user.id,
    action: "password_changed",
  });

  return { success: true };
}
