import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  orderItems,
  orders,
  products,
  paymentProofs,
  paymentVerifications,
  shipments,
} from "@/db/schema";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guard";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { buildOrderTimeline } from "@/lib/orders/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { PaymentProofForm } from "./payment-proof-form";

export default async function ResellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("reseller");

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.resellerId !== user.resellerId) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      lineTotal: orderItems.lineTotal,
      productName: products.name,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const [proof] = await db
    .select()
    .from(paymentProofs)
    .where(eq(paymentProofs.orderId, id))
    .orderBy(desc(paymentProofs.submittedAt))
    .limit(1);

  const [verification] = await db
    .select()
    .from(paymentVerifications)
    .where(eq(paymentVerifications.orderId, id))
    .limit(1);

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, id))
    .limit(1);

  const timelineSteps = buildOrderTimeline(order, proof ?? null, verification ?? null, shipment ?? null);

  return (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline steps={timelineSteps} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.quantity} × {item.productName}
                </span>
                <span className="text-muted-foreground">
                  {formatMoney(item.lineTotal)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
              <span>Total</span>
              <span>{formatMoney(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {order.status === "pending_payment" && (
          <PaymentProofForm orderId={order.id} />
        )}

        {order.status !== "pending_payment" && (
          <p className="text-sm text-muted-foreground">
            Payment proof has been submitted for this order. You&apos;ll see the
            status update here as it moves through verification and shipping.
          </p>
        )}
      </div>
    </div>
  );
}
