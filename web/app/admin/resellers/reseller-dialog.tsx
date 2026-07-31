"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createReseller, updateReseller } from "@/lib/actions/resellers";
import { toast } from "sonner";
import type { Reseller } from "@/db/schema";

export function ResellerDialog({ reseller }: { reseller?: Reseller }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(reseller);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEdit && reseller) {
          await updateReseller(reseller.id, formData);
        } else {
          await createReseller(formData);
        }
        toast.success(isEdit ? "Reseller updated." : "Reseller added.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus /> Add reseller
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit reseller" : "Add reseller"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={reseller?.companyName}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={reseller?.contactName}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={reseller?.phone ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Contact email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={reseller?.email}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={reseller?.address ?? ""}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add reseller"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
