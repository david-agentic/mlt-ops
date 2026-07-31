"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  icon,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "success";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg [&_svg]:size-4.5",
              tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              tone === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              tone === "default" && "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
