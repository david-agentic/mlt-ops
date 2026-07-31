"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PackingLabel({
  orderNumber,
  companyName,
  address,
  courier,
  trackingNumber,
}: {
  orderNumber: string;
  companyName: string;
  address: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Tag /> Label
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-sm">
          <DialogTitle className="sr-only">Courier label for {orderNumber}</DialogTitle>
          <div id="packing-label" className="flex flex-col items-center gap-3 p-2 text-center">
            <QRCodeSVG value={trackingNumber || orderNumber} size={140} />
            <p className="text-2xl font-bold tracking-tight">{orderNumber}</p>
            <p className="text-sm font-medium">{companyName}</p>
            {address && <p className="text-sm text-muted-foreground">{address}</p>}
            {courier && (
              <p className="text-sm">
                {courier} {trackingNumber ? `· ${trackingNumber}` : ""}
              </p>
            )}
          </div>
          <Button onClick={() => window.print()} className="print:hidden">
            <Printer /> Print label
          </Button>
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #packing-label,
          #packing-label * {
            visibility: visible;
          }
          #packing-label {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
