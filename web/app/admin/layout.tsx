import { requireRole } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/resellers", label: "Resellers" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return (
    <PortalShell user={user} title="Admin" nav={NAV}>
      {children}
    </PortalShell>
  );
}
