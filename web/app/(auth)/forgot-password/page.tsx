import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PORTAL_HOME } from "@/lib/auth/guard";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(PORTAL_HOME[user.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll email you a link to reset it
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
