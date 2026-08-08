import { Receipt, Timer, XCircle, Trophy } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { formatMoney } from "@/lib/format";
import type { OperationalInsights as Insights } from "@/lib/analytics/dashboard";

export function OperationalInsights({ insights }: { insights: Insights }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-title font-semibold">Operational Insights</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Receipt />}
          title="Avg Order Value"
          value={formatMoney(insights.avgOrderValue)}
          secondary="Last 30 days"
          delay={0}
        />
        <MetricCard
          icon={<Timer />}
          title="Avg Fulfillment Time"
          value={
            insights.avgFulfillmentHours !== null
              ? `${Math.round(insights.avgFulfillmentHours)}h`
              : undefined
          }
          secondary="Order placed to dispatch"
          empty={insights.avgFulfillmentHours === null}
          emptyLabel="No dispatches yet"
          delay={0.03}
        />
        <MetricCard
          icon={<XCircle />}
          title="Cancellation Rate"
          value={`${insights.cancellationRatePercent}%`}
          secondary="Last 30 days"
          status={insights.cancellationRatePercent > 10 ? "warning" : "success"}
          delay={0.06}
        />
        <MetricCard
          icon={<Trophy />}
          title="Top Reseller"
          value={insights.topReseller?.companyName}
          secondary={
            insights.topReseller
              ? `${formatMoney(insights.topReseller.revenue)} last 30 days`
              : undefined
          }
          empty={!insights.topReseller}
          emptyLabel="No orders yet"
          href="/admin/resellers"
          delay={0.09}
        />
      </div>
    </div>
  );
}
