"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { staffUserSchema, resetPasswordSchema } from "@/lib/validation/user";
import { firstIssueMessage } from "@/lib/validation/format-error";
import { logger } from "@/lib/logger";

export type StaffActionState = { error?: string; success?: string };

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
  });
  if (!result.success) return { error: firstIssueMessage(result.error) };

  const { name, role, password } = result.data;
  const email = result.data.email.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) return { error: "A user with that email already exists." };

  await db.insert(users).values({
    email,
    name,
    role,
    resellerId: null,
    passwordHash: await hashPassword(password),
  });

  logger.info("staff user created", { by: admin.id, email, role });
  revalidatePath("/admin/team");
  return { success: `${role} login created for ${email}.` };
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
    .set({ passwordHash: await hashPassword(result.data.password) })
    .where(eq(users.id, userId));

  // Force re-authentication with the new password everywhere.
  await db.delete(sessions).where(eq(sessions.userId, userId));

  logger.info("password reset by admin", { by: admin.id, targetUserId: userId });
  revalidatePath("/admin/team");
  revalidatePath("/admin/resellers");
  return { success: "Password reset. All existing sessions for this user were signed out." };
}

export async function toggleUserActive(userId: string, active: boolean) {
  const admin = await requireRole("admin");
  if (admin.id === userId && !active) {
    throw new Error("You cannot deactivate your own account.");
  }

  await db.update(users).set({ active }).where(eq(users.id, userId));
  if (!active) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  logger.info("user active state changed", { by: admin.id, targetUserId: userId, active });
  revalidatePath("/admin/team");
  revalidatePath("/admin/resellers");
}
