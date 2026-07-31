import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, paymentProofs, paymentVerifications } from "@/db/schema";

export type ResellerOrderSummary = {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  verifiedAmount: string | null;
  createdAt: Date;
};

export async function getResellerOrderHistory(
  resellerId: string,
  excludeOrderId?: string,
): Promise<ResellerOrderSummary[]> {
  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      verifiedAmount: paymentVerifications.verifiedAmount,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(paymentVerifications, eq(paymentVerifications.orderId, orders.id))
    .where(eq(orders.resellerId, resellerId))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  return excludeOrderId ? rows.filter((r) => r.orderId !== excludeOrderId) : rows;
}

export type ResellerRiskProfile = {
  totalOrders: number;
  disputeCount: number;
  averageDaysToPay: number | null;
  flags: string[];
};

export async function getResellerRiskProfile(
  resellerId: string,
): Promise<ResellerRiskProfile> {
  const [{ totalOrders }] = await db
    .select({ totalOrders: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.resellerId, resellerId));

  const [{ disputeCount }] = await db
    .select({ disputeCount: sql<number>`count(*)::int` })
    .from(paymentProofs)
    .innerJoin(orders, eq(paymentProofs.orderId, orders.id))
    .where(
      and(
        eq(orders.resellerId, resellerId),
        sql`${paymentProofs.notes} ilike '%Rejected by finance%'`,
      ),
    );

  const paidRows = await db
    .select({
      orderCreatedAt: orders.createdAt,
      verifiedAt: paymentVerifications.verifiedAt,
    })
    .from(paymentVerifications)
    .innerJoin(orders, eq(paymentVerifications.orderId, orders.id))
    .where(eq(orders.resellerId, resellerId));

  const averageDaysToPay =
    paidRows.length === 0
      ? null
      : paidRows.reduce(
          (sum, r) =>
            sum +
            (r.verifiedAt.getTime() - r.orderCreatedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          0,
        ) / paidRows.length;

  const flags: string[] = [];
  if (totalOrders <= 2) flags.push("New customer — limited order history");
  if (disputeCount > 0)
    flags.push(
      `${disputeCount} previous payment ${disputeCount === 1 ? "dispute" : "disputes"}`,
    );
  if (averageDaysToPay !== null && averageDaysToPay > 3)
    flags.push(`Averages ${averageDaysToPay.toFixed(1)} days to pay`);

  return { totalOrders, disputeCount, averageDaysToPay, flags };
}
