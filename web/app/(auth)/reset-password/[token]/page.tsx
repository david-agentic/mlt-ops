import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PORTAL_HOME } from "@/lib/auth/guard";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(PORTAL_HOME[user.role]);
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a new password</p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
