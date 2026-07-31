"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  submitPaymentProofState,
  type SubmitProofState,
} from "@/lib/actions/orders";

const initialState: SubmitProofState = {};

export function PaymentProofForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(
    submitPaymentProofState,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit payment proof</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amountClaimed">Amount paid (GBP)</Label>
            <Input
              id="amountClaimed"
              name="amountClaimed"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reference">Transfer reference (optional)</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="e.g. bank reference number"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">Proof of payment (screenshot/photo)</Label>
            <Input id="file" name="file" type="file" accept="image/*" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="e.g. paid via bank transfer" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            Submit proof
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
