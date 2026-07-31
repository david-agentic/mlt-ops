"use client";

import { useActionState, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetUserPassword, type StaffActionState } from "@/lib/actions/users";

const initialState: StaffActionState = {};

export function ResetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const action = resetUserPassword.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound /> Reset password
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {name}</DialogTitle>
          <DialogDescription>
            This signs them out everywhere. Share the new password securely.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`newPassword-${userId}`}>New password</Label>
            <Input
              id={`newPassword-${userId}`}
              name="password"
              type="text"
              minLength={8}
              required
            />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
