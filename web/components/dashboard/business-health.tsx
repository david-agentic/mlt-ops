"use client";

import { motion } from "framer-motion";
import { CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BusinessHealth } from "@/lib/analytics/dashboard";

const CONFIG: Record<
  BusinessHealth,
  { label: string; icon: typeof CircleCheck; className: string }
> = {
  healthy: {
    label: "Healthy",
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  attention: {
    label: "Needs attention",
    icon: CircleAlert,
    className: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    icon: CircleX,
    className: "text-red-600 dark:text-red-400",
  },
};

export function BusinessHealthCard({ health }: { health: BusinessHealth }) {
  const { label, icon: Icon, className } = CONFIG[health];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Icon className={`size-8 ${className}`} />
          <div>
            <p className={`text-lg font-semibold ${className}`}>{label}</p>
            <p className="text-xs text-muted-foreground">Business health</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
