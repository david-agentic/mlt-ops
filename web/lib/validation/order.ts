import { z } from "zod";

export const paymentProofSchema = z.object({
  amountClaimed: z.coerce.number().min(0.01, "Enter the amount paid"),
  reference: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type PaymentProofFormValues = z.infer<typeof paymentProofSchema>;

export const verifyPaymentSchema = z.object({
  verifiedAmount: z.coerce.number().min(0.01, "Enter the confirmed amount"),
  method: z.enum(["bank_transfer", "cash"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type VerifyPaymentFormValues = z.infer<typeof verifyPaymentSchema>;

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required"),
});

export type RejectPaymentFormValues = z.infer<typeof rejectPaymentSchema>;

export const financeNoteSchema = z.object({
  note: z.string().trim().min(1, "Note text is required"),
  type: z.enum(["note", "hold", "escalate"]),
});

export type FinanceNoteFormValues = z.infer<typeof financeNoteSchema>;

export const packOrderSchema = z.object({
  courier: z.string().trim().min(1, "Courier is required"),
  trackingNumber: z.string().trim().min(1, "Tracking number is required"),
  weightKg: z.coerce.number().min(0).optional().or(z.literal("")),
  dimensions: z.string().trim().optional().or(z.literal("")),
});

export type PackOrderFormValues = z.infer<typeof packOrderSchema>;
