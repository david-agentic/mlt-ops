import { requireRole, redirectIfMustChangePassword } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/resellers", label: "Resellers" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  redirectIfMustChangePassword(user);

  return (
    <PortalShell user={user} title="Admin" nav={NAV}>
      {children}
    </PortalShell>
  );
}
