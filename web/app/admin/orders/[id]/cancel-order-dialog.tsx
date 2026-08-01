"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelOrder } from "@/lib/actions/orders";

export function CancelOrderDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Ban /> Cancel order
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The reseller will need to place a new order if they
            still want these items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 px-4 pb-2">
          <Label htmlFor="cancelReason">Reason</Label>
          <Textarea
            id="cancelReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this order being cancelled?"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  await cancelOrder(orderId, reason);
                  toast.success("Order cancelled.");
                  setOpen(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Something went wrong.");
                }
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            Cancel order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
