import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Must be 0 or more"),
  costPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Unit is required"),
  stockOnHand: z.coerce.number().int().min(0).default(0),
  incomingStock: z.coerce.number().int().min(0).default(0),
});

export type ProductFormValues = z.infer<typeof productSchema>;
