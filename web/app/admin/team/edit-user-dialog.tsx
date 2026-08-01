"use client";

import { useActionState, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
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
import { updateUser, type StaffActionState } from "@/lib/actions/users";

const initialState: StaffActionState = {};

export function EditUserDialog({
  userId,
  name,
  email,
  role,
}: {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "finance" | "shipping";
}) {
  const [open, setOpen] = useState(false);
  const action = updateUser.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`editName-${userId}`}>Name</Label>
            <Input id={`editName-${userId}`} name="name" defaultValue={name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`editEmail-${userId}`}>Email</Label>
            <Input
              id={`editEmail-${userId}`}
              name="email"
              type="email"
              defaultValue={email}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`editRole-${userId}`}>Role</Label>
            <Select name="role" defaultValue={role}>
              <SelectTrigger id={`editRole-${userId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
