"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PackageCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";
import { markPacked } from "@/lib/actions/orders";
import { PackingLabel } from "./packing-label";

type Item = { productName: string; quantity: number };

export function PackChecklistCard({
  orderId,
  orderNumber,
  companyName,
  address,
  totalAmount,
  updatedAt,
  items,
}: {
  orderId: string;
  orderNumber: string;
  companyName: string;
  address: string | null;
  totalAmount: string;
  updatedAt: string | Date;
  items: Item[];
}) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [pending, startTransition] = useTransition();

  const allChecked = checked.length > 0 && checked.every(Boolean);
  const canSubmit = allChecked && courier.trim() && trackingNumber.trim();

  function toggle(i: number) {
    setChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  }

  function handlePack() {
    startTransition(async () => {
      try {
        await markPacked(orderId, courier, trackingNumber, weightKg, dimensions);
        toast.success(`${orderNumber} marked as packed.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{orderNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">{companyName}</p>
            {address && <p className="text-xs text-muted-foreground">{address}</p>}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{formatMoney(totalAmount)}</p>
            <p>Verified {formatDate(updatedAt)}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Packing checklist</p>
            {items.map((item, i) => (
              <label
                key={`${item.productName}-${i}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox checked={checked[i]} onCheckedChange={() => toggle(i)} />
                <span className={checked[i] ? "text-muted-foreground line-through" : ""}>
                  {item.quantity} × {item.productName}
                </span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`courier-${orderId}`}>Courier</Label>
              <Input
                id={`courier-${orderId}`}
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`tracking-${orderId}`}>Tracking number</Label>
              <Input
                id={`tracking-${orderId}`}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`weight-${orderId}`}>Weight (kg)</Label>
              <Input
                id={`weight-${orderId}`}
                type="number"
                step="0.1"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`dimensions-${orderId}`}>Dimensions</Label>
              <Input
                id={`dimensions-${orderId}`}
                placeholder="30x20x10cm"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={!canSubmit || pending} onClick={handlePack}>
              {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />}
              Confirm packed
            </Button>
            <PackingLabel
              orderNumber={orderNumber}
              companyName={companyName}
              address={address}
              courier={courier || null}
              trackingNumber={trackingNumber || null}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
