import { requireUser, PORTAL_HOME } from "@/lib/auth/guard";
import { PortalShell } from "@/components/portal-shell";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <PortalShell
      user={user}
      title="Account"
      nav={[{ href: PORTAL_HOME[user.role], label: "Back to portal" }]}
    >
      <div className="mx-auto flex max-w-sm flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold">Change password</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ll stay signed in here; all your other active sessions will be
            signed out.
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </PortalShell>
  );
}
