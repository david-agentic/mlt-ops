import {
  CircleDollarSign,
  PackageCheck,
  Banknote,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getOperationsSnapshot,
  getUrgentAlerts,
  getLiveActivity,
  getTeamWorkload,
  getCashExpected,
  getBehindCounts,
  getGoalProgress,
  computeBusinessHealth,
} from "@/lib/analytics/dashboard";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { UrgentAlerts } from "@/components/dashboard/urgent-alerts";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { BusinessHealthCard } from "@/components/dashboard/business-health";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { formatMoney, greetingForTime } from "@/lib/format";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");

  const [snapshot, alerts, activity, workload, cashExpected, behind, goalProgress] =
    await Promise.all([
      getOperationsSnapshot(),
      getUrgentAlerts(),
      getLiveActivity(15),
      getTeamWorkload(),
      getCashExpected(),
      getBehindCounts(),
      getGoalProgress(),
    ]);

  const health = computeBusinessHealth(
    alerts.length,
    behind.financeBehind + behind.warehouseBehind,
  );

  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {greetingForTime()}, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground">Here's how the business looks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <BusinessHealthCard health={health} />
        <MetricTile label="Revenue Today" value={formatMoney(snapshot.revenueToday)} icon={<Banknote />} tone="success" delay={0.03} />
        <MetricTile label="Cash Expected" value={formatMoney(cashExpected)} icon={<Wallet />} delay={0.06} />
        <MetricTile
          label="Finance Behind"
          value={`${behind.financeBehind} orders`}
          icon={<CircleDollarSign />}
          tone={behind.financeBehind > 0 ? "warning" : "default"}
          delay={0.09}
        />
        <MetricTile
          label="Warehouse Behind"
          value={`${behind.warehouseBehind} orders`}
          icon={<PackageCheck />}
          tone={behind.warehouseBehind > 0 ? "warning" : "default"}
          delay={0.12}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GoalProgress goal={goalProgress.goal} shippedToday={goalProgress.shippedToday} />
        <UrgentAlerts alerts={alerts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <LiveActivity events={activity} />
        <TeamWorkload {...workload} />
      </div>
    </div>
  );
}
