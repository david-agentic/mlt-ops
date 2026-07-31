"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { productSchema } from "@/lib/validation/product";
import { firstIssueMessage } from "@/lib/validation/format-error";

function parseProductForm(formData: FormData) {
  const result = productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    unitPrice: formData.get("unitPrice"),
    costPrice: formData.get("costPrice"),
    unit: formData.get("unit"),
    stockOnHand: formData.get("stockOnHand"),
    incomingStock: formData.get("incomingStock"),
  });
  if (!result.success) throw new Error(firstIssueMessage(result.error));
  return result.data;
}

export async function createProduct(formData: FormData) {
  await requireRole("admin");
  const values = parseProductForm(formData);

  await db.insert(products).values({
    sku: values.sku,
    name: values.name,
    description: values.description || null,
    unitPrice: values.unitPrice.toFixed(2),
    costPrice: values.costPrice ? values.costPrice.toFixed(2) : null,
    unit: values.unit,
    stockOnHand: values.stockOnHand,
    incomingStock: values.incomingStock,
  });

  revalidatePath("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireRole("admin");
  const values = parseProductForm(formData);

  await db
    .update(products)
    .set({
      sku: values.sku,
      name: values.name,
      description: values.description || null,
      unitPrice: values.unitPrice.toFixed(2),
      costPrice: values.costPrice ? values.costPrice.toFixed(2) : null,
      unit: values.unit,
      stockOnHand: values.stockOnHand,
      incomingStock: values.incomingStock,
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath("/reseller/catalog");
}

export async function toggleProductActive(id: string, active: boolean) {
  await requireRole("admin");

  await db.update(products).set({ active }).where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath("/reseller/catalog");
}
