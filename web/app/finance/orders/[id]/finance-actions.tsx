"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, PauseCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  verifyPaymentSchema,
  rejectPaymentSchema,
  financeNoteSchema,
  type VerifyPaymentFormValues,
  type RejectPaymentFormValues,
  type FinanceNoteFormValues,
} from "@/lib/validation/order";
import { verifyPayment, rejectPayment, addFinanceNote } from "@/lib/actions/orders";

export function FinanceActions({
  orderId,
  claimedAmount,
}: {
  orderId: string;
  claimedAmount: string;
}) {
  return (
    <Tabs defaultValue="approve">
      <TabsList className="w-full">
        <TabsTrigger value="approve" className="flex-1">
          Approve
        </TabsTrigger>
        <TabsTrigger value="reject" className="flex-1">
          Reject
        </TabsTrigger>
        <TabsTrigger value="hold" className="flex-1">
          Hold / Escalate
        </TabsTrigger>
      </TabsList>

      <TabsContent value="approve" className="mt-4">
        <ApproveForm orderId={orderId} claimedAmount={claimedAmount} />
      </TabsContent>
      <TabsContent value="reject" className="mt-4">
        <RejectForm orderId={orderId} />
      </TabsContent>
      <TabsContent value="hold" className="mt-4">
        <NoteForm orderId={orderId} />
      </TabsContent>
    </Tabs>
  );
}

function ApproveForm({
  orderId,
  claimedAmount,
}: {
  orderId: string;
  claimedAmount: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<
    z.input<typeof verifyPaymentSchema>,
    unknown,
    z.output<typeof verifyPaymentSchema>
  >({
    resolver: zodResolver(verifyPaymentSchema),
    defaultValues: {
      verifiedAmount: Number(claimedAmount),
      method: "bank_transfer",
      notes: "",
    },
  });

  const verifiedAmount = watch("verifiedAmount");
  const isPartial =
    !Number.isNaN(Number(verifiedAmount)) && Number(verifiedAmount) !== Number(claimedAmount);

  function onValid(values: VerifyPaymentFormValues) {
    startTransition(async () => {
      try {
        await verifyPayment(orderId, String(values.verifiedAmount), values.method, values.notes ?? "");
        toast.success(
          isPartial ? "Partially approved — released to warehouse." : "Approved — released to warehouse.",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="verifiedAmount">Confirmed amount (GBP)</Label>
        <Input
          id="verifiedAmount"
          type="number"
          step="0.01"
          aria-invalid={!!errors.verifiedAmount}
          {...register("verifiedAmount")}
        />
        {errors.verifiedAmount && (
          <p className="text-xs text-destructive">{errors.verifiedAmount.message}</p>
        )}
        {isPartial && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This differs from the claimed amount — will be recorded as a partial approval.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Method</Label>
        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="approveNotes">Notes (optional)</Label>
        <Textarea id="approveNotes" {...register("notes")} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        {isPartial ? "Partially approve" : "Approve"}
      </Button>
    </form>
  );
}

function RejectForm({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectPaymentFormValues>({ resolver: zodResolver(rejectPaymentSchema) });

  function onValid(values: RejectPaymentFormValues) {
    startTransition(async () => {
      try {
        await rejectPayment(orderId, values.reason);
        toast.success("Rejected — reseller can resubmit.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          placeholder="e.g. amount doesn't match, unclear proof..."
          aria-invalid={!!errors.reason}
          {...register("reason")}
        />
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <XCircle />}
        Reject and notify reseller
      </Button>
    </form>
  );
}

function NoteForm({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FinanceNoteFormValues>({
    resolver: zodResolver(financeNoteSchema),
    defaultValues: { type: "hold", note: "" },
  });

  const type = watch("type");

  function onValid(values: FinanceNoteFormValues) {
    startTransition(async () => {
      try {
        await addFinanceNote(orderId, values.note, values.type);
        toast.success(
          values.type === "escalate"
            ? "Escalated — flagged for admin attention."
            : "Order put on hold.",
        );
        reset({ type: values.type, note: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="escalate">Escalate</SelectItem>
                <SelectItem value="note">Internal note</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Details</Label>
        <Textarea
          id="note"
          placeholder="Why is this on hold / escalated?"
          aria-invalid={!!errors.note}
          {...register("note")}
        />
        {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : type === "escalate" ? (
          <Flag />
        ) : (
          <PauseCircle />
        )}
        {type === "escalate" ? "Escalate" : type === "hold" ? "Put on hold" : "Add note"}
      </Button>
    </form>
  );
}
