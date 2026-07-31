import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import {
  orders,
  resellers,
  orderItems,
  products,
  paymentProofs,
  financeNotes,
  users,
} from "@/db/schema";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ZoomableImage } from "@/components/orders/zoomable-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/format";
import {
  getResellerOrderHistory,
  getResellerRiskProfile,
} from "@/lib/analytics/finance";
import { FinanceActions } from "./finance-actions";

export default async function FinanceOrderDeskPage({
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
      resellerId: orders.resellerId,
      companyName: resellers.companyName,
      contactName: resellers.contactName,
      email: resellers.email,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) notFound();

  const [items, [proof], notes, history, risk] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id)),
    db
      .select()
      .from(paymentProofs)
      .where(eq(paymentProofs.orderId, id))
      .orderBy(desc(paymentProofs.submittedAt))
      .limit(1),
    db
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
      .orderBy(desc(financeNotes.createdAt)),
    getResellerOrderHistory(order.resellerId, id),
    getResellerRiskProfile(order.resellerId),
  ]);

  const difference = proof ? Number(proof.amountClaimed) - Number(order.totalAmount) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.companyName} · {order.contactName}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left: proof */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Payment Proof</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {proof ? (
              <>
                <ZoomableImage src={proof.fileUrl} alt="Payment proof" />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Claimed amount</span>
                    <span className="font-medium">{formatMoney(proof.amountClaimed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span>{proof.reference || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{formatDate(proof.submittedAt)}</span>
                  </div>
                </div>
                {proof.notes && (
                  <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                    {proof.notes}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No payment proof submitted yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Middle: amounts + history */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amounts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected (order total)</span>
                <span className="font-medium">{formatMoney(order.totalAmount)}</span>
              </div>
              {proof && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claimed</span>
                  <span className="font-medium">{formatMoney(proof.amountClaimed)}</span>
                </div>
              )}
              {difference !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difference</span>
                  <span
                    className={
                      difference === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }
                  >
                    {difference === 0 ? "Matches" : formatMoney(difference)}
                  </span>
                </div>
              )}
              <div className="mt-2 border-t border-border pt-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span>
                      {item.quantity} × {item.productName}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order History — {order.companyName}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {history.length === 0 ? (
                <p className="text-muted-foreground">No previous orders.</p>
              ) : (
                history.map((h) => (
                  <Link
                    key={h.orderId}
                    href={`/admin/orders/${h.orderId}`}
                    className="flex items-center justify-between rounded-md px-1 py-1 transition-colors hover:bg-muted"
                  >
                    <span>{h.orderNumber}</span>
                    <span className="text-muted-foreground">
                      {formatMoney(h.totalAmount)} · {h.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: risk + notes + actions */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total orders</span>
                <span>{risk.totalOrders}</span>
              </div>
              {risk.flags.length === 0 ? (
                <p className="text-emerald-600 dark:text-emerald-400">
                  No risk flags on this account.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {risk.flags.map((flag) => (
                    <li
                      key={flag}
                      className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {notes.length === 0 ? (
                <p className="text-muted-foreground">No notes yet.</p>
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

          {order.status === "payment_submitted" && proof && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <FinanceActions orderId={order.id} claimedAmount={proof.amountClaimed} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
