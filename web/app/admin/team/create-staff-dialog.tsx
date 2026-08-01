"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  createStaffUser,
  inviteStaffUser,
  type StaffActionState,
} from "@/lib/actions/users";

const initialState: StaffActionState = {};

function RoleField({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Role</Label>
      <Select name="role" defaultValue="finance">
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
          <SelectItem value="shipping">Shipping</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TemporaryPasswordForm() {
  const [state, formAction, pending] = useActionState(createStaffUser, initialState);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
  }, [state?.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffName">Name</Label>
        <Input id="staffName" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffEmail">Email</Label>
        <Input id="staffEmail" name="email" type="email" required />
      </div>
      <RoleField id="staffRole" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffPassword">Temporary password</Label>
        <Input id="staffPassword" name="password" type="text" minLength={12} required />
        <p className="text-xs text-muted-foreground">
          At least 12 characters, mixing 3 of: lowercase, uppercase, number, symbol.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="mustChangePassword" name="mustChangePassword" defaultChecked />
        <Label htmlFor="mustChangePassword" className="font-normal">
          Require password change on first login
        </Label>
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
  );
}

function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteStaffUser, initialState);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
  }, [state?.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inviteName">Name</Label>
        <Input id="inviteName" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inviteEmail">Email</Label>
        <Input id="inviteEmail" name="email" type="email" required />
      </div>
      <RoleField id="inviteRole" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Send invitation
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogDescription>
            Set a temporary password yourself, or send an email invitation so they set
            their own.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="password">
          <TabsList>
            <TabsTrigger value="password">Temporary password</TabsTrigger>
            <TabsTrigger value="invite">Email invite</TabsTrigger>
          </TabsList>
          <TabsContent value="password">
            <TemporaryPasswordForm />
          </TabsContent>
          <TabsContent value="invite">
            <InviteForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
