"use client";

import { SetNewPasswordForm } from "@/components/auth/set-new-password-form";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  return (
    <SetNewPasswordForm
      token={token}
      action={resetPasswordAction}
      submitLabel="Reset password"
      successHeading="Password reset"
      successBody="You've been signed out everywhere else. Sign in with your new password."
    />
  );
}
