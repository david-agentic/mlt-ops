import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import {
  orders,
  resellers,
  orderItems,
  products,
  paymentProofs,
  paymentVerifications,
  shipments,
  financeNotes,
  users,
} from "@/db/schema";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { buildOrderTimeline } from "@/lib/orders/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/format";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { PrintButton } from "./print-button";

const CANCELLABLE_STATUSES = new Set([
  "pending_payment",
  "payment_submitted",
  "payment_verified",
  "packed",
]);

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      companyName: resellers.companyName,
      contactName: resellers.contactName,
      email: resellers.email,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      lineTotal: orderItems.lineTotal,
      productName: products.name,
      sku: products.sku,
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
    .select({
      verifiedAmount: paymentVerifications.verifiedAmount,
      method: paymentVerifications.method,
      verifiedAt: paymentVerifications.verifiedAt,
      notes: paymentVerifications.notes,
      verifiedByName: users.name,
    })
    .from(paymentVerifications)
    .innerJoin(users, eq(paymentVerifications.verifiedBy, users.id))
    .where(eq(paymentVerifications.orderId, id))
    .limit(1);

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, id))
    .limit(1);

  const notes = await db
    .select({
      id: financeNotes.id,
      type: financeNotes.type,
      note: financeNotes.note,
      createdAt: financeNotes.createdAt,
      authorName: users.name,
    })
    .from(financeNotes)
    .innerJoin(users, eq(financeNotes.authorId, users.id))
    .where(eq(financeNotes.orderId, id))
    .orderBy(desc(financeNotes.createdAt));

  const timelineSteps = buildOrderTimeline(order, proof ?? null, verification ?? null, shipment ?? null);

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.companyName} · {order.contactName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <div className="flex gap-2 print:hidden">
            <PrintButton />
            {CANCELLABLE_STATUSES.has(order.status) && (
              <CancelOrderDialog orderId={order.id} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline steps={timelineSteps} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{item.productName}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {item.quantity} × {formatMoney(item.unitPrice)} ={" "}
                    {formatMoney(item.lineTotal)}
                  </div>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
                <span>Total</span>
                <span>{formatMoney(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {proof && (
            <Card>
              <CardHeader>
                <CardTitle>Payment proof</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p>
                  Claimed amount: <strong>{formatMoney(proof.amountClaimed)}</strong>{" "}
                  · submitted {formatDate(proof.submittedAt)}
                </p>
                {proof.notes && (
                  <p className="text-muted-foreground">{proof.notes}</p>
                )}
                <a
                  href={proof.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block h-64 w-full overflow-hidden rounded-md border border-border"
                >
                  <Image
                    src={proof.fileUrl}
                    alt="Payment proof"
                    fill
                    sizes="(max-width: 768px) 100vw, 700px"
                    className="object-contain"
                  />
                </a>
              </CardContent>
            </Card>
          )}

          {verification && (
            <Card>
              <CardHeader>
                <CardTitle>Payment verification</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Verified <strong>{formatMoney(verification.verifiedAmount)}</strong>{" "}
                  via {verification.method.replace("_", " ")} by{" "}
                  {verification.verifiedByName} on{" "}
                  {formatDate(verification.verifiedAt)}
                </p>
                {verification.notes && (
                  <p className="mt-1 text-muted-foreground">
                    {verification.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {shipment && (
            <Card>
              <CardHeader>
                <CardTitle>Shipment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <p>
                  Courier: {shipment.courier || "—"} · Tracking:{" "}
                  {shipment.trackingNumber || "—"}
                </p>
                {shipment.packedAt && (
                  <p className="text-muted-foreground">
                    Packed {formatDate(shipment.packedAt)}
                  </p>
                )}
                {shipment.dispatchedAt && (
                  <p className="text-muted-foreground">
                    Dispatched {formatDate(shipment.dispatchedAt)}
                  </p>
                )}
                {shipment.deliveredAt && (
                  <p className="text-muted-foreground">
                    Delivered {formatDate(shipment.deliveredAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Finance Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {notes.length === 0 ? (
                <p className="text-muted-foreground">No notes on this order yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="rounded-md border border-border p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant={n.type === "escalate" ? "destructive" : "outline"}>
                        {n.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p>{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">— {n.authorName}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
