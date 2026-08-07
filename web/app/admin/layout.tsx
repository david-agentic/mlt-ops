import { requireRole, redirectIfMustChangePassword } from "@/lib/auth/guard";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { getUrgentAlerts } from "@/lib/analytics/dashboard";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
      { href: "/admin/products", label: "Products", icon: "Package" },
      { href: "/admin/resellers", label: "Resellers", icon: "Building2" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/team", label: "Team", icon: "Users" },
      { href: "/admin/audit", label: "Audit Log", icon: "ShieldCheck" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  redirectIfMustChangePassword(user);

  const alerts = await getUrgentAlerts();

  return (
    <AppShell
      portalLabel="Admin"
      navGroups={NAV_GROUPS}
      user={user}
      notificationCount={alerts.length}
    >
      {children}
    </AppShell>
  );
}
