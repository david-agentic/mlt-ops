import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, type Order, type OrderStatus } from "@/db/schema";

export async function getOrderOrThrow(orderId: string): Promise<Order> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) throw new Error("Order not found.");
  return order;
}

/**
 * Fetches an order and asserts it's in the expected status before a
 * lifecycle transition proceeds — the single source of truth for the
 * order state machine (pending_payment -> payment_submitted ->
 * payment_verified -> packed -> shipped -> delivered).
 */
export async function assertOrderStatus(
  orderId: string,
  expected: OrderStatus,
  message: string,
  opts?: { resellerId?: string | null },
): Promise<Order> {
  const order = await getOrderOrThrow(orderId);
  if (opts?.resellerId !== undefined && order.resellerId !== opts.resellerId) {
    throw new Error("Order not found.");
  }
  if (order.status !== expected) throw new Error(message);
  return order;
}
