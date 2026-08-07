"use client";

import { motion } from "framer-motion";
import { CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion";
import type { BusinessHealth } from "@/lib/analytics/dashboard";

const CONFIG: Record<
  BusinessHealth,
  {
    label: string;
    icon: typeof CircleCheck;
    iconClass: string;
    ringClass: string;
  }
> = {
  healthy: {
    label: "All systems healthy",
    icon: CircleCheck,
    iconClass: "bg-success/10 text-success",
    ringClass: "ring-success/15",
  },
  attention: {
    label: "Needs attention",
    icon: CircleAlert,
    iconClass: "bg-warning/15 text-warning",
    ringClass: "ring-warning/20",
  },
  critical: {
    label: "Critical — act now",
    icon: CircleX,
    iconClass: "bg-destructive/10 text-destructive",
    ringClass: "ring-destructive/20",
  },
};

function describe(health: BusinessHealth, alertCount: number, behindTotal: number) {
  if (health === "healthy") {
    return "No orders are behind and nothing needs attention right now.";
  }
  const alertPart = `${alertCount} alert${alertCount === 1 ? "" : "s"}`;
  const behindPart = `${behindTotal} order${behindTotal === 1 ? "" : "s"} behind schedule`;
  return `${alertPart} · ${behindPart}`;
}

export function BusinessHealthCard({
  health,
  alertCount,
  financeBehind,
  warehouseBehind,
}: {
  health: BusinessHealth;
  alertCount: number;
  financeBehind: number;
  warehouseBehind: number;
}) {
  const behindTotal = financeBehind + warehouseBehind;
  const cfg = CONFIG[health];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
    >
      <Card className={cn("flex-col gap-4 py-4 shadow-card ring-1 sm:flex-row sm:items-center", cfg.ringClass)}>
        <div className="flex flex-1 items-center gap-3 px-(--card-spacing)">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
              cfg.iconClass,
            )}
          >
            <Icon />
          </div>
          <div className="min-w-0">
            <p className="text-title font-semibold">{cfg.label}</p>
            <p className="truncate text-sm text-muted-foreground">
              {describe(health, alertCount, behindTotal)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6 border-t border-border px-(--card-spacing) pt-4 sm:border-t-0 sm:border-l sm:px-6 sm:pt-0">
          <Stat label="Alerts" value={alertCount} />
          <Stat label="Finance behind" value={financeBehind} />
          <Stat label="Warehouse behind" value={warehouseBehind} />
        </div>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <p className={cn("text-lg leading-tight font-semibold", value > 0 ? "text-warning" : "text-foreground")}>
        {value}
      </p>
      <p className="text-caption whitespace-nowrap text-muted-foreground">{label}</p>
    </div>
  );
}
