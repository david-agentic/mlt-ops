"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Hourglass,
  CircleDollarSign,
  BadgeCheck,
  PackageCheck,
  Truck,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, STAGGER_STEP } from "@/lib/motion";
import type { PipelineStage } from "@/lib/analytics/dashboard";

const STAGE_ICON: Record<string, LucideIcon> = {
  pending_payment: Hourglass,
  payment_submitted: CircleDollarSign,
  payment_verified: BadgeCheck,
  packed: PackageCheck,
  shipped: Truck,
  delivered: CircleCheck,
};

export function OrderPipeline({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  const inProgress = stages
    .filter((s) => s.key !== "delivered")
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <SectionCard
      title="Order Pipeline"
      action={
        <span className="text-caption text-muted-foreground">
          {inProgress} order{inProgress === 1 ? "" : "s"} in progress
        </span>
      }
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0">
        {stages.map((stage, i) => {
          const Icon = STAGE_ICON[stage.key];
          const isLast = i === stages.length - 1;
          const isDelivered = stage.key === "delivered";

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT, delay: i * STAGGER_STEP }}
              className="flex flex-1 items-center"
            >
              <div className="flex flex-1 flex-col gap-2 rounded-lg px-3 py-2.5 sm:px-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                      isDelivered ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg leading-tight font-semibold">{stage.count}</p>
                    <p className="truncate text-caption text-muted-foreground">{stage.label}</p>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", isDelivered ? "bg-success" : "bg-primary")}
                    style={{ width: `${Math.max(6, Math.round((stage.count / max) * 100))}%` }}
                  />
                </div>
              </div>
              {!isLast && (
                <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground/30 sm:block" />
              )}
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}
