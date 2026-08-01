"use server";

import { eq, and, ne, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, invitations } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import {
  hashPassword,
  generateToken,
  hashToken,
  DUMMY_PASSWORD_HASH,
} from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import {
  staffUserSchema,
  inviteStaffUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "@/lib/validation/user";
import { firstIssueMessage } from "@/lib/validation/format-error";
import { logger } from "@/lib/logger";
import { logAudit } from "@/lib/actions/audit";
import { sendInvitationEmail } from "@/lib/email";
import { config } from "@/lib/config";

export type StaffActionState = { error?: string; success?: string };

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

async function emailInUse(email: string): Promise<boolean> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return Boolean(existing[0]);
}

export async function createStaffUser(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const admin = await requireRole("admin");

  const result = staffUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    mustChangePassword: Boolean(formData.get("mustChangePassword")),
  });
  if (!result.success) return { error: firstIssueMessage(result.error) };

  const { name, role, password, mustChangePassword } = result.data;
  const email = result.data.email.toLowerCase();

  if (await emailInUse(email)) {
    return { error: "A user with that email already exists." };
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      role,
      resellerId: null,
      passwordHash: await hashPassword(password),
      mustChangePassword,
      passwordChangedAt: new Date(),
    })
    .returning({ id: users.id });

  logger.info("staff user created", { by: admin.id, email, role });
  await logAudit({
    actorUserId: admin.id,
    targetUserId: created.id,
    action: "user_created",
    metadata: { email, role, method: "temporary_password" },
  });
  revalidatePath("/admin/team");
  return { success: `${role} login created for ${email}.` };
}

export async function inviteStaffUser(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const admin = await requireRole("admin");

  const result = inviteStaffUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!result.success) return { error: firstIssueMessage(result.error) };

  const { name, role } = result.data;
  const email = result.data.email.toLowerCase();

  if (await emailInUse(email)) {
    return { error: "A user with that email already exists." };
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      role,
      resellerId: null,
      // Unusable placeholder — a random hash the user can never type their
      // way into; the account only becomes usable once the invitation is
      // accepted and a real password is set.
      passwordHash: DUMMY_PASSWORD_HASH,
      mustChangePassword: true,
    })
    .returning({ id: users.id });

  const rawToken = generateToken();
  await db.insert(invitations).values({
    userId: created.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  });

  const link = `${config.appUrl}/invite/${rawToken}`;
  await sendInvitationEmail(email, link, admin.name);

  logger.info("staff user invited", { by: admin.id, email, role });
  await logAudit({
    actorUserId: admin.id,
    targetUserId: created.id,
    action: "invitation_sent",
    metadata: { email, role },
  });
  revalidatePath("/admin/team");
  return { success: `Invitation sent to ${email}.` };
}

export async function updateUser(
  userId: string,
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const admin = await requireRole("admin");

  const result = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!result.success) return { error: firstIssueMessage(result.error) };

  const { name, role } = result.data;
  const email = result.data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .limit(1);
  if (existing) return { error: "A user with that email already exists." };

  const [before] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.update(users).set({ name, email, role }).where(eq(users.id, userId));

  await logAudit({
    actorUserId: admin.id,
    targetUserId: userId,
    action: "user_updated",
    metadata: { name, email, role },
  });
  if (before && before.role !== role) {
    await logAudit({
      actorUserId: admin.id,
      targetUserId: userId,
      action: "user_role_changed",
      metadata: { from: before.role, to: role },
    });
  }

  logger.info("user updated", { by: admin.id, targetUserId: userId });
  revalidatePath("/admin/team");
  return { success: "User updated." };
}

export async function resetUserPassword(
  userId: string,
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const admin = await requireRole("admin");

  const result = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!result.success) return { error: firstIssueMessage(result.error) };

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(result.data.password),
      passwordChangedAt: new Date(),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId));

  // Force re-authentication with the new password everywhere.
  await destroyAllSessionsForUser(userId);

  logger.info("password reset by admin", { by: admin.id, targetUserId: userId });
  await logAudit({
    actorUserId: admin.id,
    targetUserId: userId,
    action: "password_reset_by_admin",
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/resellers");
  return {
    success:
      "Password reset. All existing sessions for this user were signed out, and they'll be asked to set a new password on next login.",
  };
}

export type ToggleActiveState = { error?: string; success?: boolean };

export async function toggleUserActive(
  userId: string,
  active: boolean,
): Promise<ToggleActiveState> {
  const admin = await requireRole("admin");
  if (admin.id === userId && !active) {
    return { error: "You cannot deactivate your own account." };
  }

  await db.update(users).set({ active }).where(eq(users.id, userId));
  if (!active) {
    await destroyAllSessionsForUser(userId);
  }

  logger.info("user active state changed", { by: admin.id, targetUserId: userId, active });
  await logAudit({
    actorUserId: admin.id,
    targetUserId: userId,
    action: active ? "user_enabled" : "user_disabled",
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/resellers");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<ToggleActiveState> {
  const admin = await requireRole("admin");
  if (admin.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  await db
    .update(users)
    .set({ deletedAt: new Date(), active: false })
    .where(eq(users.id, userId));
  await destroyAllSessionsForUser(userId);

  logger.info("user deleted", { by: admin.id, targetUserId: userId });
  await logAudit({ actorUserId: admin.id, targetUserId: userId, action: "user_deleted" });
  revalidatePath("/admin/team");
  revalidatePath("/admin/resellers");
  return { success: true };
}
