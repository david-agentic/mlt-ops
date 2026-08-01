"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import type { RecentOrder } from "@/lib/analytics/dashboard";

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Recent Orders</CardTitle>
        <Link
          href="/admin/orders"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {orders.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No orders yet — orders will appear here as resellers place them.
          </p>
        ) : (
          orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="w-24 shrink-0 truncate font-medium">{order.orderNumber}</span>
                <span className="flex-1 truncate text-muted-foreground">{order.companyName}</span>
                <span className="shrink-0 font-medium">{formatMoney(order.totalAmount)}</span>
                <span className="shrink-0">
                  <OrderStatusBadge status={order.status} />
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  {formatRelativeTime(order.createdAt)}
                </span>
              </Link>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
