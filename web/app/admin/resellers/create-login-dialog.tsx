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
import {
  createResellerUser,
  type CreateResellerUserState,
} from "@/lib/actions/resellers";

const initialState: CreateResellerUserState = {};

export function CreateLoginDialog({
  resellerId,
  resellerName,
}: {
  resellerId: string;
  resellerName: string;
}) {
  const [open, setOpen] = useState(false);
  const action = createResellerUser.bind(null, resellerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound /> Create login
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create login for {resellerName}</DialogTitle>
          <DialogDescription>
            This creates a reseller portal account. Share the password with
            them securely.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Login email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              minLength={8}
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {state.success}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Create login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
