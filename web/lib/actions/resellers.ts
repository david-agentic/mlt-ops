"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { resellers, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { resellerSchema, resellerUserSchema } from "@/lib/validation/reseller";
import { firstIssueMessage } from "@/lib/validation/format-error";

function parseResellerForm(formData: FormData) {
  const result = resellerSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });
  if (!result.success) throw new Error(firstIssueMessage(result.error));
  return result.data;
}

export async function createReseller(formData: FormData) {
  await requireRole("admin");
  const values = parseResellerForm(formData);

  await db.insert(resellers).values({
    companyName: values.companyName,
    contactName: values.contactName,
    email: values.email,
    phone: values.phone || null,
    address: values.address || null,
  });

  revalidatePath("/admin/resellers");
}

export async function updateReseller(id: string, formData: FormData) {
  await requireRole("admin");
  const values = parseResellerForm(formData);

  await db
    .update(resellers)
    .set({
      companyName: values.companyName,
      contactName: values.contactName,
      email: values.email,
      phone: values.phone || null,
      address: values.address || null,
    })
    .where(eq(resellers.id, id));

  revalidatePath("/admin/resellers");
}

export async function toggleResellerActive(id: string, active: boolean) {
  await requireRole("admin");

  await db.update(resellers).set({ active }).where(eq(resellers.id, id));

  revalidatePath("/admin/resellers");
}

export type CreateResellerUserState = { error?: string; success?: string };

export async function createResellerUser(
  resellerId: string,
  _prevState: CreateResellerUserState,
  formData: FormData,
): Promise<CreateResellerUserState> {
  await requireRole("admin");

  const result = resellerUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) {
    return { error: firstIssueMessage(result.error) };
  }
  const { name, password } = result.data;
  const email = result.data.email.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return { error: "A user with that email already exists." };
  }

  await db.insert(users).values({
    email,
    name,
    role: "reseller",
    resellerId,
    passwordHash: await hashPassword(password),
  });

  revalidatePath("/admin/resellers");
  return { success: `Login created for ${email}.` };
}
