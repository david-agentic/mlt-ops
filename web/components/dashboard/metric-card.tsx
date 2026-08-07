"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion";

export type MetricCardStatus = "neutral" | "success" | "warning" | "danger";

const STATUS_ICON_CLASS: Record<MetricCardStatus, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

const STATUS_VALUE_CLASS: Record<MetricCardStatus, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

export type MetricCardProps = {
  icon: React.ReactNode;
  title: string;
  /** Primary value. Ignored while `loading`. */
  value?: React.ReactNode;
  /** Secondary context or trend line shown under the value, e.g. "+12% vs yesterday". */
  secondary?: React.ReactNode;
  status?: MetricCardStatus;
  /** Renders the card as a link when provided. */
  href?: string;
  /** Shows skeleton placeholders instead of value/secondary. */
  loading?: boolean;
  /** Shows a muted "nothing here" state instead of the value — distinct from a real 0. */
  empty?: boolean;
  emptyLabel?: string;
  /** Stagger delay in seconds for the mount-in animation. */
  delay?: number;
  className?: string;
};

export function MetricCard({
  icon,
  title,
  value,
  secondary,
  status = "neutral",
  href,
  loading = false,
  empty = false,
  emptyLabel = "No data",
  delay = 0,
  className,
}: MetricCardProps) {
  const interactive = Boolean(href) && !loading;

  const body = (
    <Card
      className={cn(
        "h-full py-4 shadow-card transition-all",
        interactive && "hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start gap-3 px-(--card-spacing)">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4.5",
            STATUS_ICON_CLASS[status],
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-caption font-medium text-muted-foreground">{title}</p>

          {loading ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : empty ? (
            <p className="mt-0.5 text-title font-semibold text-muted-foreground/70">{emptyLabel}</p>
          ) : (
            <>
              <p className={cn("mt-0.5 text-xl leading-tight font-semibold", STATUS_VALUE_CLASS[status])}>
                {value}
              </p>
              {secondary && (
                <p className="mt-0.5 truncate text-caption text-muted-foreground">{secondary}</p>
              )}
            </>
          )}
        </div>

        {interactive && (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover/card:translate-x-0.5" />
        )}
      </div>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT, delay }}
      className="h-full"
    >
      {interactive ? (
        <Link href={href!} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
}
