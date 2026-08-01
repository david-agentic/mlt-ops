import {
  CircleDollarSign,
  PackageCheck,
  Banknote,
  Wallet,
  Truck,
  Building2,
  PackageX,
  Hourglass,
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
  getAdminKpis,
  getRecentOrders,
  computeBusinessHealth,
} from "@/lib/analytics/dashboard";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { UrgentAlerts } from "@/components/dashboard/urgent-alerts";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { BusinessHealthCard } from "@/components/dashboard/business-health";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { formatMoney, greetingForTime } from "@/lib/format";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");

  const [
    snapshot,
    alerts,
    activity,
    workload,
    cashExpected,
    behind,
    goalProgress,
    kpis,
    recentOrders,
  ] = await Promise.all([
    getOperationsSnapshot(),
    getUrgentAlerts(),
    getLiveActivity(15),
    getTeamWorkload(),
    getCashExpected(),
    getBehindCounts(),
    getGoalProgress(),
    getAdminKpis(),
    getRecentOrders(8),
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
        <p className="text-sm text-muted-foreground">Here&apos;s how the business looks.</p>
      </div>

      <UrgentAlerts alerts={alerts} />

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Pending Payment"
          value={`${snapshot.ordersWaiting} orders`}
          icon={<Hourglass />}
          delay={0.15}
        />
        <MetricTile
          label="Ready to Ship"
          value={`${kpis.readyToShip} orders`}
          icon={<Truck />}
          delay={0.18}
        />
        <MetricTile
          label="Active Resellers"
          value={`${kpis.activeResellers}`}
          icon={<Building2 />}
          delay={0.21}
        />
        <MetricTile
          label="Low Stock"
          value={`${kpis.lowStockCount} products`}
          icon={<PackageX />}
          tone={kpis.lowStockCount > 0 ? "warning" : "default"}
          delay={0.24}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GoalProgress goal={goalProgress.goal} shippedToday={goalProgress.shippedToday} />
        <RecentOrders orders={recentOrders} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <LiveActivity events={activity} />
        <TeamWorkload {...workload} />
      </div>
    </div>
  );
}
