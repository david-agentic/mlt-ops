import type { Order, PaymentProof, PaymentVerification, Shipment } from "@/db/schema";

export type TimelineStep = {
  key: string;
  label: string;
  timestamp: Date | null;
  done: boolean;
  current: boolean;
};

/**
 * Builds the order lifecycle timeline from real timestamps already on the
 * order + its related records — no fabricated steps or dates.
 */
export function buildOrderTimeline(
  order: Pick<Order, "createdAt" | "status">,
  proof: Pick<PaymentProof, "submittedAt"> | null,
  verification: Pick<PaymentVerification, "verifiedAt"> | null,
  shipment: Pick<Shipment, "packedAt" | "dispatchedAt" | "deliveredAt"> | null,
): TimelineStep[] {
  const isCancelled = order.status === "cancelled";

  const raw: { key: string; label: string; timestamp: Date | null }[] = [
    { key: "submitted", label: "Order submitted", timestamp: order.createdAt },
    { key: "uploaded", label: "Payment proof uploaded", timestamp: proof?.submittedAt ?? null },
    {
      key: "verified",
      label: "Finance verified — released to warehouse",
      timestamp: verification?.verifiedAt ?? null,
    },
    { key: "packed", label: "Packed", timestamp: shipment?.packedAt ?? null },
    { key: "dispatched", label: "Courier collected", timestamp: shipment?.dispatchedAt ?? null },
    { key: "delivered", label: "Delivered", timestamp: shipment?.deliveredAt ?? null },
  ];

  const lastDoneIndex = raw.reduce(
    (acc, step, i) => (step.timestamp ? i : acc),
    isCancelled ? -1 : 0,
  );

  return raw.map((step, i) => ({
    ...step,
    done: !!step.timestamp,
    current: !isCancelled && i === lastDoneIndex + 1 && !step.timestamp,
  }));
}
