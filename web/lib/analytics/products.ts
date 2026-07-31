import "server-only";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, resellers } from "@/db/schema";

const RESERVED_STATUSES = ["payment_verified", "packed"] as const;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export type ProductIntelligence = {
  stockOnHand: number;
  incomingStock: number;
  reserved: number;
  soldThisWeek: number;
  soldPreviousWeek: number;
  revenue30d: number;
  bestReseller: string | null;
  marginPercent: number | null;
};

export async function getProductIntelligence(productId: string): Promise<ProductIntelligence> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) throw new Error("Product not found.");

  const [{ reserved }] = await db
    .select({ reserved: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        inArray(orders.status, RESERVED_STATUSES),
      ),
    );

  const [{ soldThisWeek }] = await db
    .select({ soldThisWeek: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, productId), gte(orders.createdAt, daysAgo(7))));

  const [{ soldPreviousWeek }] = await db
    .select({ soldPreviousWeek: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        gte(orders.createdAt, daysAgo(14)),
        lt(orders.createdAt, daysAgo(7)),
      ),
    );

  const [{ revenue30d }] = await db
    .select({ revenue30d: sql<string>`coalesce(sum(${orderItems.lineTotal}), 0)` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, productId), gte(orders.createdAt, daysAgo(30))));

  const resellerRows = await db
    .select({
      companyName: resellers.companyName,
      totalQty: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .where(eq(orderItems.productId, productId))
    .groupBy(resellers.id, resellers.companyName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(1);

  const marginPercent = product.costPrice
    ? ((Number(product.unitPrice) - Number(product.costPrice)) / Number(product.unitPrice)) * 100
    : null;

  return {
    stockOnHand: product.stockOnHand,
    incomingStock: product.incomingStock,
    reserved,
    soldThisWeek,
    soldPreviousWeek,
    revenue30d: Number(revenue30d),
    bestReseller: resellerRows[0]?.companyName ?? null,
    marginPercent,
  };
}
