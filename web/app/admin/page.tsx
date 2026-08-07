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
  getOrderPipeline,
  computeBusinessHealth,
} from "@/lib/analytics/dashboard";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OrderPipeline } from "@/components/dashboard/order-pipeline";
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
    pipeline,
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
    getOrderPipeline(),
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

      <BusinessHealthCard
        health={health}
        alertCount={alerts.length}
        financeBehind={behind.financeBehind}
        warehouseBehind={behind.warehouseBehind}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue Today"
          value={formatMoney(snapshot.revenueToday)}
          secondary="So far today"
          icon={<Banknote />}
          status="success"
          delay={0.03}
        />
        <MetricCard
          title="Cash Expected"
          value={formatMoney(cashExpected)}
          secondary="Awaiting settlement"
          icon={<Wallet />}
          delay={0.06}
        />
        <MetricCard
          title="Finance Behind"
          value={`${behind.financeBehind} orders`}
          secondary={behind.financeBehind > 0 ? "Needs finance review" : "On track"}
          icon={<CircleDollarSign />}
          status={behind.financeBehind > 0 ? "warning" : "success"}
          href="/admin/orders"
          delay={0.09}
        />
        <MetricCard
          title="Warehouse Behind"
          value={`${behind.warehouseBehind} orders`}
          secondary={behind.warehouseBehind > 0 ? "Needs packing" : "On track"}
          icon={<PackageCheck />}
          status={behind.warehouseBehind > 0 ? "warning" : "success"}
          href="/admin/orders"
          delay={0.12}
        />
        <MetricCard
          title="Pending Payment"
          value={`${snapshot.ordersWaiting} orders`}
          secondary="Awaiting proof of payment"
          icon={<Hourglass />}
          href="/admin/orders"
          delay={0.15}
        />
        <MetricCard
          title="Ready to Ship"
          value={`${kpis.readyToShip} orders`}
          secondary="Packed, awaiting courier"
          icon={<Truck />}
          href="/admin/orders"
          delay={0.18}
        />
        <MetricCard
          title="Active Resellers"
          value={`${kpis.activeResellers}`}
          secondary="Currently active"
          icon={<Building2 />}
          href="/admin/resellers"
          delay={0.21}
        />
        <MetricCard
          title="Low Stock"
          value={`${kpis.lowStockCount} products`}
          secondary={kpis.lowStockCount > 0 ? "Reorder soon" : "All stocked"}
          icon={<PackageX />}
          status={kpis.lowStockCount > 0 ? "warning" : "success"}
          href="/admin/products"
          delay={0.24}
        />
      </div>

      <OrderPipeline stages={pipeline} />

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
