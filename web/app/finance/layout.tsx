import { requireRole, redirectIfMustChangePassword } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";

const NAV = [{ href: "/finance", label: "Verification Queue" }];

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("finance");
  redirectIfMustChangePassword(user);

  return (
    <PortalShell user={user} title="Finance" nav={NAV}>
      {children}
    </PortalShell>
  );
}
