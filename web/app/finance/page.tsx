import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, resellers, paymentProofs } from "@/db/schema";
import { EmptyState } from "@/components/empty-state";
import { illustrationPath } from "@/lib/illustrations";
import { CircleDollarSign } from "lucide-react";
import { QueueList } from "./queue-list";

export default async function FinanceQueuePage() {
  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      companyName: resellers.companyName,
      fileUrl: paymentProofs.fileUrl,
      amountClaimed: paymentProofs.amountClaimed,
      submittedAt: paymentProofs.submittedAt,
      notes: paymentProofs.notes,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .innerJoin(paymentProofs, eq(paymentProofs.orderId, orders.id))
    .where(eq(orders.status, "payment_submitted"))
    .orderBy(desc(paymentProofs.submittedAt));

  // Keep only the latest proof per order (in case of resubmissions)
  const latestByOrder = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByOrder.has(row.orderId)) latestByOrder.set(row.orderId, row);
  }
  const items = Array.from(latestByOrder.values());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Verification Queue</h1>
        <p className="text-sm text-muted-foreground">
          Orders awaiting payment confirmation.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          illustrationUrl={illustrationPath("empty-finance.svg")}
          title="No payments pending"
          description="You're all caught up. New payment proofs will appear here as resellers submit them."
        />
      ) : (
        <QueueList items={items} />
      )}
    </div>
  );
}
