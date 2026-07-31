import { z } from "zod";

export const STAFF_ROLES = ["admin", "finance", "shipping"] as const;

export const staffUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(STAFF_ROLES),
});

export type StaffUserFormValues = z.infer<typeof staffUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
