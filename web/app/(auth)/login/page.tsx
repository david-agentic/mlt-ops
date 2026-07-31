import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PORTAL_HOME } from "@/lib/auth/guard";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(PORTAL_HOME[user.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">MLT Ops</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your portal
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
