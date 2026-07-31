import { requireRole } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";

const NAV = [
  { href: "/reseller", label: "Catalog" },
  { href: "/reseller/orders", label: "My Orders" },
];

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("reseller");

  return (
    <PortalShell user={user} title="Reseller" nav={NAV}>
      {children}
    </PortalShell>
  );
}
