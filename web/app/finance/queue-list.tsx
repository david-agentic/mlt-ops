"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";

type QueueItem = {
  orderId: string;
  orderNumber: string;
  companyName: string;
  totalAmount: string;
  amountClaimed: string;
  fileUrl: string;
  submittedAt: string | Date;
  notes: string | null;
};

export function QueueList({ items }: { items: QueueItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.orderId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{item.orderNumber}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {formatDate(item.submittedAt)}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{item.companyName}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="relative h-40 w-full overflow-hidden rounded-md border border-border bg-muted">
                <Image
                  src={item.fileUrl}
                  alt="Payment proof"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain"
                />
              </div>
              <div className="text-sm">
                <p>
                  Order total: <strong>{formatMoney(item.totalAmount)}</strong>
                </p>
                <p>
                  Claimed paid:{" "}
                  <strong>{formatMoney(item.amountClaimed)}</strong>
                </p>
                {item.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.notes}
                  </p>
                )}
              </div>
              <Button
                className="mt-auto w-full"
                nativeButton={false}
                render={
                  <Link href={`/finance/orders/${item.orderId}`}>
                    Open finance desk <ArrowRight />
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
