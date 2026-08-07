"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { RevenuePoint } from "@/lib/analytics/dashboard";

const RANGES = [
  { key: 7, label: "7D" },
  { key: 30, label: "30D" },
  { key: 90, label: "90D" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function shortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: RevenuePoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-card-hover">
      <p className="text-caption text-muted-foreground">{shortDate(point.date)}</p>
      <p className="font-semibold">{formatMoney(point.revenue)}</p>
    </div>
  );
}

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const [range, setRange] = useState<RangeKey>(30);

  const { slice, total, changePercent } = useMemo(() => {
    const slice = points.slice(-range);
    const total = slice.reduce((sum, p) => sum + p.revenue, 0);

    const previous = points.slice(-range * 2, -range);
    const previousTotal = previous.reduce((sum, p) => sum + p.revenue, 0);
    const changePercent =
      previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;

    return { slice, total, changePercent };
  }, [points, range]);

  return (
    <SectionCard
      title="Revenue"
      action={
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRange(r.key)}
              className={cn(
                "h-6 px-2 text-caption font-medium",
                range === r.key
                  ? "bg-background shadow-card text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="mb-4 flex items-baseline gap-2.5">
        <p className="text-display font-semibold tracking-tight">{formatMoney(total)}</p>
        {changePercent !== null && (
          <span
            className={cn(
              "text-sm font-medium",
              changePercent >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {changePercent >= 0 ? "+" : ""}
            {changePercent}% vs prior {range}D
          </span>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={slice} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              tickFormatter={(v: number) => (v >= 1000 ? `£${Math.round(v / 1000)}k` : `£${v}`)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
