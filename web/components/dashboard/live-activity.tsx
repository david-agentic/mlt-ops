"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Receipt,
  CheckCircle2,
  PackageCheck,
  Truck,
  Home,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime, formatTime } from "@/lib/format";
import type { ActivityEvent } from "@/lib/analytics/dashboard";

const ICONS: Record<ActivityEvent["type"], LucideIcon> = {
  order_placed: ShoppingCart,
  payment_uploaded: Receipt,
  payment_verified: CheckCircle2,
  packed: PackageCheck,
  dispatched: Truck,
  delivered: Home,
};

export function LiveActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Live Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {events.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing has happened yet — activity will appear here as orders move.
          </p>
        ) : (
          events.map((event, i) => {
            const Icon = ICONS[event.type];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Link
                  href={`/admin/orders/${event.orderId}`}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className="w-11 shrink-0 font-mono text-xs text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </span>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{event.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </Link>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
