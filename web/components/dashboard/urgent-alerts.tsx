"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UrgentAlert } from "@/lib/analytics/dashboard";

export function UrgentAlerts({ alerts }: { alerts: UrgentAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Things needing attention</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            All clear — nothing needs attention right now.
          </div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Link
                href={alert.href}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{alert.message}</span>
              </Link>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
