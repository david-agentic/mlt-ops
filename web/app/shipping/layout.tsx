import { requireRole, redirectIfMustChangePassword } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";

const NAV = [{ href: "/shipping", label: "Fulfillment Queue" }];

export default async function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("shipping");
  redirectIfMustChangePassword(user);

  return (
    <PortalShell user={user} title="Shipping" nav={NAV}>
      {children}
    </PortalShell>
  );
}
