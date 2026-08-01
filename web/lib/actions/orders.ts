"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  orders,
  orderItems,
  products,
  paymentProofs,
  paymentVerifications,
  shipments,
  financeNotes,
  type OrderStatus,
} from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { saveUpload } from "@/lib/storage";
import { assertOrderStatus, getOrderOrThrow } from "@/lib/orders/assert-status";
import {
  paymentProofSchema,
  verifyPaymentSchema,
  rejectPaymentSchema,
  packOrderSchema,
  financeNoteSchema,
} from "@/lib/validation/order";
import { firstIssueMessage } from "@/lib/validation/format-error";

export type OrderItemInput = { productId: string; quantity: number };

export async function createOrder(items: OrderItemInput[]) {
  const user = await requireRole("reseller");
  if (!user.resellerId) throw new Error("No reseller linked to this user.");
  if (!items.length) throw new Error("Order must contain at least one item.");

  const productIds = items.map((i) => i.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const productMap = new Map(productRows.map((p) => [p.id, p]));

  const [reservedRows] = await Promise.all([
    db
      .select({
        productId: orderItems.productId,
        reserved: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, ["payment_verified", "packed"]),
        ),
      )
      .groupBy(orderItems.productId),
  ]);
  const reservedMap = new Map(reservedRows.map((r) => [r.productId, r.reserved]));

  let total = 0;
  const lineItems = items.map(({ productId, quantity }) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive whole number.");
    }
    const product = productMap.get(productId);
    if (!product || !product.active) {
      throw new Error("One or more products are no longer available.");
    }
    const available = product.stockOnHand - (reservedMap.get(productId) ?? 0);
    if (quantity > available) {
      throw new Error(
        `Only ${Math.max(available, 0)} unit(s) of "${product.name}" are available right now.`,
      );
    }
    const unitPrice = Number(product.unitPrice);
    const lineTotal = unitPrice * quantity;
    total += lineTotal;
    return {
      productId,
      quantity,
      unitPrice: unitPrice.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    };
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders);
  const orderNumber = `ORD-${String(count + 1).padStart(5, "0")}`;

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        resellerId: user.resellerId!,
        status: "pending_payment",
        totalAmount: total.toFixed(2),
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      lineItems.map((li) => ({
        orderId: order.id,
        ...li,
      })),
    );

    return order.id;
  });

  revalidatePath("/reseller/orders");
  redirect(`/reseller/orders/${orderId}`);
}

export async function submitPaymentProof(
  orderId: string,
  fileUrl: string,
  amountClaimed: string,
  reference: string,
  notes: string,
) {
  const user = await requireRole("reseller");

  await assertOrderStatus(
    orderId,
    "pending_payment",
    "Payment proof already submitted for this order.",
    { resellerId: user.resellerId },
  );

  await db.transaction(async (tx) => {
    await tx.insert(paymentProofs).values({
      orderId,
      fileUrl,
      amountClaimed,
      reference: reference || null,
      notes: notes || null,
    });
    await tx
      .update(orders)
      .set({ status: "payment_submitted", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  revalidatePath(`/reseller/orders/${orderId}`);
  revalidatePath("/reseller/orders");
}

export async function submitPaymentProofAction(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please attach a payment proof image.");
  }

  const result = paymentProofSchema.safeParse({
    amountClaimed: formData.get("amountClaimed"),
    reference: formData.get("reference"),
    notes: formData.get("notes"),
  });
  if (!result.success) throw new Error(firstIssueMessage(result.error));

  const fileUrl = await saveUpload(file);
  await submitPaymentProof(
    orderId,
    fileUrl,
    result.data.amountClaimed.toFixed(2),
    result.data.reference ?? "",
    result.data.notes ?? "",
  );
}

export type SubmitProofState = { error?: string };

export async function submitPaymentProofState(
  _prevState: SubmitProofState,
  formData: FormData,
): Promise<SubmitProofState> {
  try {
    await submitPaymentProofAction(formData);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function verifyPayment(
  orderId: string,
  verifiedAmount: string,
  method: "bank_transfer" | "cash",
  notes: string,
) {
  const user = await requireRole("finance");

  const parsed = verifyPaymentSchema.safeParse({ verifiedAmount, method, notes });
  if (!parsed.success) throw new Error(firstIssueMessage(parsed.error));

  await assertOrderStatus(
    orderId,
    "payment_submitted",
    "Order is not awaiting payment verification.",
  );

  await db.transaction(async (tx) => {
    await tx.insert(paymentVerifications).values({
      orderId,
      verifiedBy: user.id,
      verifiedAmount: parsed.data.verifiedAmount.toFixed(2),
      method: parsed.data.method,
      notes: parsed.data.notes || null,
    });
    await tx
      .update(orders)
      .set({ status: "payment_verified", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  revalidatePath("/finance");
  revalidatePath("/shipping");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function rejectPayment(orderId: string, reason: string) {
  await requireRole("finance");

  const parsed = rejectPaymentSchema.safeParse({ reason });
  if (!parsed.success) throw new Error(firstIssueMessage(parsed.error));

  await assertOrderStatus(
    orderId,
    "payment_submitted",
    "Order is not awaiting payment verification.",
  );

  await db.transaction(async (tx) => {
    const [latestProof] = await tx
      .select()
      .from(paymentProofs)
      .where(eq(paymentProofs.orderId, orderId))
      .orderBy(desc(paymentProofs.submittedAt))
      .limit(1);

    if (latestProof) {
      await tx
        .update(paymentProofs)
        .set({
          notes: `${latestProof.notes ? latestProof.notes + " | " : ""}Rejected by finance: ${parsed.data.reason}`,
        })
        .where(eq(paymentProofs.id, latestProof.id));
    }

    await tx
      .update(orders)
      .set({ status: "pending_payment", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  revalidatePath("/finance");
  revalidatePath("/reseller/orders");
}

export async function markPacked(
  orderId: string,
  courier: string,
  trackingNumber: string,
  weightKg: string,
  dimensions: string,
) {
  const user = await requireRole("shipping");

  const parsed = packOrderSchema.safeParse({ courier, trackingNumber, weightKg, dimensions });
  if (!parsed.success) throw new Error(firstIssueMessage(parsed.error));

  await assertOrderStatus(orderId, "payment_verified", "Order is not ready to pack.");

  await db.transaction(async (tx) => {
    await tx.insert(shipments).values({
      orderId,
      courier: parsed.data.courier,
      trackingNumber: parsed.data.trackingNumber,
      weightKg: parsed.data.weightKg ? String(parsed.data.weightKg) : null,
      dimensions: parsed.data.dimensions || null,
      packedBy: user.id,
      packedAt: new Date(),
    });
    await tx
      .update(orders)
      .set({ status: "packed", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  revalidatePath("/shipping");
}

export async function markDispatched(orderId: string) {
  await requireRole("shipping");

  await assertOrderStatus(
    orderId,
    "packed",
    "Order has not been packed yet.",
  );

  await db.transaction(async (tx) => {
    await tx
      .update(shipments)
      .set({ dispatchedAt: new Date() })
      .where(eq(shipments.orderId, orderId));
    await tx
      .update(orders)
      .set({ status: "shipped", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Physical stock leaves the warehouse at dispatch.
    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      await tx
        .update(products)
        .set({ stockOnHand: sql`${products.stockOnHand} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  });

  revalidatePath("/shipping");
  revalidatePath("/reseller/orders");
  revalidatePath("/admin/products");
}

export async function addFinanceNote(
  orderId: string,
  note: string,
  type: "note" | "hold" | "escalate",
) {
  const user = await requireRole("finance");

  const parsed = financeNoteSchema.safeParse({ note, type });
  if (!parsed.success) throw new Error(firstIssueMessage(parsed.error));

  await getOrderOrThrow(orderId);

  await db.insert(financeNotes).values({
    orderId,
    authorId: user.id,
    type: parsed.data.type,
    note: parsed.data.note,
  });

  revalidatePath(`/finance/orders/${orderId}`);
}

const CANCELLABLE_STATUSES: OrderStatus[] = [
  "pending_payment",
  "payment_submitted",
  "payment_verified",
  "packed",
];

export async function cancelOrder(orderId: string, reason: string) {
  const admin = await requireRole("admin");
  if (!reason.trim()) throw new Error("A cancellation reason is required.");

  const order = await getOrderOrThrow(orderId);
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new Error(
      `Orders that are already ${order.status.replace(/_/g, " ")} can no longer be cancelled.`,
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await tx.insert(financeNotes).values({
      orderId,
      authorId: admin.id,
      type: "note",
      note: `Order cancelled by ${admin.name}: ${reason}`,
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function markDelivered(orderId: string) {
  await requireRole("shipping");

  await assertOrderStatus(
    orderId,
    "shipped",
    "Order has not been dispatched yet.",
  );

  await db.transaction(async (tx) => {
    await tx
      .update(shipments)
      .set({ deliveredAt: new Date() })
      .where(eq(shipments.orderId, orderId));
    await tx
      .update(orders)
      .set({ status: "delivered", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  revalidatePath("/shipping");
  revalidatePath("/reseller/orders");
}
