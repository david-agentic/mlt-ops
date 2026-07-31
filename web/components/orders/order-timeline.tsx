"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { TimelineStep } from "@/lib/orders/timeline";

export function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.06 }}
          className="flex gap-3"
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                step.done && "border-primary bg-primary text-primary-foreground",
                step.current && "border-primary text-primary animate-pulse",
                !step.done && !step.current && "border-border text-muted-foreground",
              )}
            >
              {step.done ? <Check className="size-3.5" /> : null}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-px flex-1 min-h-6",
                  step.done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
          <div className="pb-6">
            <p
              className={cn(
                "text-sm font-medium",
                !step.done && !step.current && "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {step.timestamp
                ? formatDate(step.timestamp)
                : step.current
                  ? "In progress"
                  : "Pending"}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
