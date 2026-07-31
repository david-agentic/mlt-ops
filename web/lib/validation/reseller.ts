import { z } from "zod";

export const resellerSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().min(1, "Contact name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
});

export type ResellerFormValues = z.infer<typeof resellerSchema>;

export const resellerUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResellerUserFormValues = z.infer<typeof resellerUserSchema>;
