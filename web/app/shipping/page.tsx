import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, resellers, orderItems, products, type OrderStatus } from "@/db/schema";
import { FulfillmentTabs } from "./fulfillment-tabs";

async function ordersByStatus(status: OrderStatus) {
  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      companyName: resellers.companyName,
      address: resellers.address,
      totalAmount: orders.totalAmount,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .where(eq(orders.status, status))
    .orderBy(desc(orders.updatedAt));

  if (rows.length === 0) return rows.map((r) => ({ ...r, items: [] as { productName: string; quantity: number }[] }));

  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      productName: products.name,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(inArray(orderItems.orderId, rows.map((r) => r.orderId)));

  return rows.map((r) => ({
    ...r,
    items: itemRows.filter((i) => i.orderId === r.orderId),
  }));
}

export default async function ShippingQueuePage() {
  const [toPack, toDispatch, toDeliver] = await Promise.all([
    ordersByStatus("payment_verified"),
    ordersByStatus("packed"),
    ordersByStatus("shipped"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Fulfillment Queue</h1>
        <p className="text-sm text-muted-foreground">
          Pack, dispatch, and confirm delivery for verified orders.
        </p>
      </div>
      <FulfillmentTabs
        toPack={toPack}
        toDispatch={toDispatch}
        toDeliver={toDeliver}
      />
    </div>
  );
}
