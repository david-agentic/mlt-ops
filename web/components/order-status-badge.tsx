import { Badge } from "@/components/ui/badge";

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_submitted: "Payment Submitted",
  payment_verified: "Payment Verified",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_payment: "outline",
  payment_submitted: "secondary",
  payment_verified: "secondary",
  packed: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
