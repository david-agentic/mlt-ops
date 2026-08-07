import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  paymentProofs,
  paymentVerifications,
  shipments,
  products,
  resellers,
  type OrderStatus,
} from "@/db/schema";
import { getDailyShippingGoal } from "@/lib/actions/settings";

const COURIER_DELAY_DAYS = 5;
const RECENT_ALERT_DAYS = 7;
const FINANCE_BEHIND_HOURS = 4;
const WAREHOUSE_BEHIND_HOURS = 4;
const OVERDUE_PAYMENT_HOURS = 24;
const LOW_STOCK_THRESHOLD = 20;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

export async function getOperationsSnapshot() {
  const [counts] = await db
    .select({
      ordersWaiting: sql<number>`count(*) filter (where ${orders.status} = 'pending_payment')::int`,
      financeQueue: sql<number>`count(*) filter (where ${orders.status} = 'payment_submitted')::int`,
      warehousePacking: sql<number>`count(*) filter (where ${orders.status} in ('payment_verified', 'packed'))::int`,
      inTransit: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
    })
    .from(orders);

  const [{ revenueToday }] = await db
    .select({
      revenueToday: sql<string>`coalesce(sum(${paymentVerifications.verifiedAmount}), 0)`,
    })
    .from(paymentVerifications)
    .where(gte(paymentVerifications.verifiedAt, startOfToday()));

  return { ...counts, revenueToday: Number(revenueToday) };
}

export async function getCashExpected(): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
    .from(orders)
    .where(inArray(orders.status, ["pending_payment", "payment_submitted"]));
  return Number(total);
}

export type PipelineStage = {
  key: OrderStatus;
  label: string;
  count: number;
};

export async function getOrderPipeline(): Promise<PipelineStage[]> {
  const [row] = await db
    .select({
      pendingPayment: sql<number>`count(*) filter (where ${orders.status} = 'pending_payment')::int`,
      paymentSubmitted: sql<number>`count(*) filter (where ${orders.status} = 'payment_submitted')::int`,
      paymentVerified: sql<number>`count(*) filter (where ${orders.status} = 'payment_verified')::int`,
      packed: sql<number>`count(*) filter (where ${orders.status} = 'packed')::int`,
      shipped: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
    })
    .from(orders);

  const [{ deliveredToday }] = await db
    .select({ deliveredToday: sql<number>`count(*)::int` })
    .from(shipments)
    .where(gte(shipments.deliveredAt, startOfToday()));

  return [
    { key: "pending_payment", label: "Pending Payment", count: row.pendingPayment },
    { key: "payment_submitted", label: "Payment Review", count: row.paymentSubmitted },
    { key: "payment_verified", label: "Ready to Pack", count: row.paymentVerified },
    { key: "packed", label: "Packed", count: row.packed },
    { key: "shipped", label: "In Transit", count: row.shipped },
    { key: "delivered", label: "Delivered Today", count: deliveredToday },
  ];
}

export async function getBehindCounts() {
  const [{ financeBehind }] = await db
    .select({ financeBehind: sql<number>`count(distinct ${orders.id})::int` })
    .from(orders)
    .innerJoin(paymentProofs, eq(paymentProofs.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "payment_submitted"),
        lt(paymentProofs.submittedAt, hoursAgo(FINANCE_BEHIND_HOURS)),
      ),
    );

  const [{ warehouseBehind }] = await db
    .select({ warehouseBehind: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["payment_verified", "packed"]),
        lt(orders.updatedAt, hoursAgo(WAREHOUSE_BEHIND_HOURS)),
      ),
    );

  return { financeBehind, warehouseBehind };
}

export type RevenuePoint = { date: string; revenue: number };

/** Daily revenue for the last `days` days, zero-filled for days with no
 * payments so the chart always has a continuous series. Fetches once for
 * the widest range (90) — the 7/30/90 toggle then just slices this
 * client-side instead of round-tripping per selection. */
export async function getRevenueSeries(days = 90): Promise<RevenuePoint[]> {
  const start = daysAgo(days - 1);
  start.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`to_char(${paymentVerifications.verifiedAt}, 'YYYY-MM-DD')`,
      revenue: sql<string>`coalesce(sum(${paymentVerifications.verifiedAmount}), 0)`,
    })
    .from(paymentVerifications)
    .where(gte(paymentVerifications.verifiedAt, start))
    .groupBy(sql`to_char(${paymentVerifications.verifiedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${paymentVerifications.verifiedAt}, 'YYYY-MM-DD')`);

  const byDate = new Map(rows.map((r) => [r.date, Number(r.revenue)]));

  const points: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, revenue: byDate.get(key) ?? 0 });
  }
  return points;
}

export async function getYesterdayVsPriorDayRevenue() {
  const [{ yesterday }] = await db
    .select({
      yesterday: sql<string>`coalesce(sum(${paymentVerifications.verifiedAmount}), 0)`,
    })
    .from(paymentVerifications)
    .where(
      and(
        gte(paymentVerifications.verifiedAt, startOfYesterday()),
        lt(paymentVerifications.verifiedAt, startOfToday()),
      ),
    );

  const dayBefore = new Date(startOfYesterday());
  dayBefore.setDate(dayBefore.getDate() - 1);
  const [{ priorDay }] = await db
    .select({
      priorDay: sql<string>`coalesce(sum(${paymentVerifications.verifiedAmount}), 0)`,
    })
    .from(paymentVerifications)
    .where(
      and(
        gte(paymentVerifications.verifiedAt, dayBefore),
        lt(paymentVerifications.verifiedAt, startOfYesterday()),
      ),
    );

  return { yesterday: Number(yesterday), priorDay: Number(priorDay) };
}

export async function getGoalProgress() {
  const [goal, [{ shippedToday }]] = await Promise.all([
    getDailyShippingGoal(),
    db
      .select({ shippedToday: sql<number>`count(*)::int` })
      .from(shipments)
      .where(gte(shipments.dispatchedAt, startOfToday())),
  ]);
  return { goal, shippedToday };
}

export type UrgentAlert = {
  id: string;
  type:
    | "payment_discrepancy"
    | "courier_delay"
    | "overdue_payment"
    | "low_stock"
    | "revenue_drop";
  message: string;
  href: string;
};

export async function getUrgentAlerts(): Promise<UrgentAlert[]> {
  const discrepancies = await db
    .select({
      verificationId: paymentVerifications.id,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      verifiedAmount: paymentVerifications.verifiedAmount,
      totalAmount: orders.totalAmount,
    })
    .from(paymentVerifications)
    .innerJoin(orders, eq(paymentVerifications.orderId, orders.id))
    .where(
      and(
        gte(paymentVerifications.verifiedAt, daysAgo(RECENT_ALERT_DAYS)),
        ne(paymentVerifications.verifiedAmount, orders.totalAmount),
      ),
    );

  const delayed = await db
    .select({
      shipmentId: shipments.id,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
    })
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(
      and(
        isNotNull(shipments.dispatchedAt),
        isNull(shipments.deliveredAt),
        lt(shipments.dispatchedAt, daysAgo(COURIER_DELAY_DAYS)),
      ),
    );

  const overdue = await db
    .select({
      proofId: paymentProofs.id,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      companyName: sql<string>`(select company_name from resellers where id = ${orders.resellerId})`,
    })
    .from(paymentProofs)
    .innerJoin(orders, eq(paymentProofs.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "payment_submitted"),
        lt(paymentProofs.submittedAt, hoursAgo(OVERDUE_PAYMENT_HOURS)),
      ),
    );

  const lowStock = await db
    .select({ id: products.id, name: products.name, stockOnHand: products.stockOnHand })
    .from(products)
    .where(and(eq(products.active, true), lt(products.stockOnHand, LOW_STOCK_THRESHOLD)));

  const { yesterday, priorDay } = await getYesterdayVsPriorDayRevenue();
  const revenueDropPercent =
    priorDay > 0 ? Math.round(((priorDay - yesterday) / priorDay) * 100) : 0;

  const alerts: UrgentAlert[] = [
    ...discrepancies.map((d) => ({
      id: `discrepancy-${d.verificationId}`,
      type: "payment_discrepancy" as const,
      message: `Order ${d.orderNumber}: confirmed £${d.verifiedAmount} vs order total £${d.totalAmount}`,
      href: `/admin/orders/${d.orderId}`,
    })),
    ...delayed.map((s) => ({
      id: `delay-${s.shipmentId}`,
      type: "courier_delay" as const,
      message: `Order ${s.orderNumber}: in transit for over ${COURIER_DELAY_DAYS} days, not yet delivered`,
      href: `/admin/orders/${s.orderId}`,
    })),
    ...overdue.map((o) => ({
      id: `overdue-${o.proofId}`,
      type: "overdue_payment" as const,
      message: `${o.companyName ?? "Reseller"} overdue payment on ${o.orderNumber} (${OVERDUE_PAYMENT_HOURS}h+)`,
      href: `/finance/orders/${o.orderId}`,
    })),
    ...lowStock.map((p) => ({
      id: `lowstock-${p.id}`,
      type: "low_stock" as const,
      message: `${p.name} is low on stock (${p.stockOnHand} left)`,
      href: `/admin/products/${p.id}`,
    })),
    ...(revenueDropPercent >= 10
      ? [
          {
            id: "revenue-drop",
            type: "revenue_drop" as const,
            message: `Revenue was ${revenueDropPercent}% lower yesterday than the day before`,
            href: "/admin",
          },
        ]
      : []),
  ];

  return alerts;
}

export type ActivityEvent = {
  id: string;
  type:
    | "order_placed"
    | "payment_uploaded"
    | "payment_verified"
    | "packed"
    | "dispatched"
    | "delivered";
  label: string;
  orderId: string;
  orderNumber: string;
  timestamp: Date;
};

export async function getLiveActivity(limit = 15): Promise<ActivityEvent[]> {
  const [placed, uploaded, verified, packed, dispatched, delivered] = await Promise.all([
    db
      .select({ id: orders.id, orderNumber: orders.orderNumber, ts: orders.createdAt })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        ts: paymentProofs.submittedAt,
      })
      .from(paymentProofs)
      .innerJoin(orders, eq(paymentProofs.orderId, orders.id))
      .orderBy(desc(paymentProofs.submittedAt))
      .limit(limit),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        ts: paymentVerifications.verifiedAt,
      })
      .from(paymentVerifications)
      .innerJoin(orders, eq(paymentVerifications.orderId, orders.id))
      .orderBy(desc(paymentVerifications.verifiedAt))
      .limit(limit),
    db
      .select({ id: orders.id, orderNumber: orders.orderNumber, ts: shipments.packedAt })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .where(isNotNull(shipments.packedAt))
      .orderBy(desc(shipments.packedAt))
      .limit(limit),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        ts: shipments.dispatchedAt,
      })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .where(isNotNull(shipments.dispatchedAt))
      .orderBy(desc(shipments.dispatchedAt))
      .limit(limit),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        ts: shipments.deliveredAt,
      })
      .from(shipments)
      .innerJoin(orders, eq(shipments.orderId, orders.id))
      .where(isNotNull(shipments.deliveredAt))
      .orderBy(desc(shipments.deliveredAt))
      .limit(limit),
  ]);

  const events: ActivityEvent[] = [
    ...placed.map((r) => ({
      id: `placed-${r.id}`,
      type: "order_placed" as const,
      label: `Order ${r.orderNumber} placed`,
      orderId: r.id,
      orderNumber: r.orderNumber,
      timestamp: r.ts,
    })),
    ...uploaded.map((r) => ({
      id: `uploaded-${r.id}-${r.ts.getTime()}`,
      type: "payment_uploaded" as const,
      label: `Payment proof uploaded for ${r.orderNumber}`,
      orderId: r.id,
      orderNumber: r.orderNumber,
      timestamp: r.ts,
    })),
    ...verified.map((r) => ({
      id: `verified-${r.id}`,
      type: "payment_verified" as const,
      label: `Finance verified ${r.orderNumber}`,
      orderId: r.id,
      orderNumber: r.orderNumber,
      timestamp: r.ts,
    })),
    ...packed
      .filter((r) => r.ts)
      .map((r) => ({
        id: `packed-${r.id}`,
        type: "packed" as const,
        label: `Warehouse packed ${r.orderNumber}`,
        orderId: r.id,
        orderNumber: r.orderNumber,
        timestamp: r.ts as Date,
      })),
    ...dispatched
      .filter((r) => r.ts)
      .map((r) => ({
        id: `dispatched-${r.id}`,
        type: "dispatched" as const,
        label: `Courier collected ${r.orderNumber}`,
        orderId: r.id,
        orderNumber: r.orderNumber,
        timestamp: r.ts as Date,
      })),
    ...delivered
      .filter((r) => r.ts)
      .map((r) => ({
        id: `delivered-${r.id}`,
        type: "delivered" as const,
        label: `${r.orderNumber} delivered`,
        orderId: r.id,
        orderNumber: r.orderNumber,
        timestamp: r.ts as Date,
      })),
  ];

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export async function getAdminKpis() {
  const [[{ readyToShip }], [{ activeResellers }], [{ lowStockCount }]] = await Promise.all([
    db
      .select({ readyToShip: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, "payment_verified")),
    db
      .select({ activeResellers: sql<number>`count(*)::int` })
      .from(resellers)
      .where(eq(resellers.active, true)),
    db
      .select({ lowStockCount: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.active, true), lt(products.stockOnHand, LOW_STOCK_THRESHOLD))),
  ]);

  return { readyToShip, activeResellers, lowStockCount };
}

export type RecentOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: Date;
  companyName: string;
};

export async function getRecentOrders(limit = 8): Promise<RecentOrder[]> {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      companyName: resellers.companyName,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getTeamWorkload() {
  const snapshot = await getOperationsSnapshot();
  return {
    finance: snapshot.financeQueue,
    shipping: snapshot.warehousePacking + snapshot.inTransit,
    admin: snapshot.ordersWaiting + snapshot.financeQueue + snapshot.warehousePacking + snapshot.inTransit,
  };
}

export type BusinessHealth = "healthy" | "attention" | "critical";

export function computeBusinessHealth(
  alertCount: number,
  behindTotal: number,
): BusinessHealth {
  if (alertCount >= 3 || behindTotal >= 5) return "critical";
  if (alertCount > 0 || behindTotal > 0) return "attention";
  return "healthy";
}
