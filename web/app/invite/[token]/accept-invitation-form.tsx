"use client";

import { SetNewPasswordForm } from "@/components/auth/set-new-password-form";
import { acceptInvitationAction } from "@/lib/actions/auth";

export function AcceptInvitationForm({ token }: { token: string }) {
  return (
    <SetNewPasswordForm
      token={token}
      action={acceptInvitationAction}
      submitLabel="Set password"
      successHeading="You're all set"
      successBody="Your password has been set. Sign in to get started."
    />
  );
}
