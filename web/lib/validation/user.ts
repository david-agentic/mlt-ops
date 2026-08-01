import { z } from "zod";
import { passwordSchema } from "./password";

export const STAFF_ROLES = ["admin", "finance", "shipping"] as const;

export const staffUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: passwordSchema,
  role: z.enum(STAFF_ROLES),
  mustChangePassword: z.boolean().optional().default(true),
});

export type StaffUserFormValues = z.infer<typeof staffUserSchema>;

export const inviteStaffUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(STAFF_ROLES),
});

export type InviteStaffUserFormValues = z.infer<typeof inviteStaffUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(STAFF_ROLES),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
