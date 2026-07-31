"use client";

import { useActionState, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createStaffUser, type StaffActionState } from "@/lib/actions/users";

const initialState: StaffActionState = {};

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createStaffUser, initialState);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus /> Add team member
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staffName">Name</Label>
            <Input id="staffName" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staffEmail">Email</Label>
            <Input id="staffEmail" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staffRole">Role</Label>
            <Select name="role" defaultValue="finance">
              <SelectTrigger id="staffRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staffPassword">Temporary password</Label>
            <Input id="staffPassword" name="password" type="text" minLength={8} required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>
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
