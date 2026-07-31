"use client";

import { Send, CheckCheck, PackageSearch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatMoney, formatDate } from "@/lib/format";
import { markDispatched, markDelivered } from "@/lib/actions/orders";
import { StatusActionButton } from "./status-action-button";
import { PackChecklistCard } from "./pack-checklist-card";
import { PackingLabel } from "./packing-label";

type Item = { productName: string; quantity: number };

type OrderRow = {
  orderId: string;
  orderNumber: string;
  companyName: string;
  address: string | null;
  totalAmount: string;
  updatedAt: string | Date;
  items: Item[];
};

export function FulfillmentTabs({
  toPack,
  toDispatch,
  toDeliver,
}: {
  toPack: OrderRow[];
  toDispatch: OrderRow[];
  toDeliver: OrderRow[];
}) {
  return (
    <Tabs defaultValue="pack">
      <TabsList>
        <TabsTrigger value="pack">To pack ({toPack.length})</TabsTrigger>
        <TabsTrigger value="dispatch">
          To dispatch ({toDispatch.length})
        </TabsTrigger>
        <TabsTrigger value="deliver">
          Out for delivery ({toDeliver.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pack">
        {toPack.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={PackageSearch}
              title="Nothing to pack"
              description="Orders will appear here once finance verifies payment."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {toPack.map((row) => (
              <PackChecklistCard
                key={row.orderId}
                orderId={row.orderId}
                orderNumber={row.orderNumber}
                companyName={row.companyName}
                address={row.address}
                totalAmount={row.totalAmount}
                updatedAt={row.updatedAt}
                items={row.items}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="dispatch">
        <OrderGrid
          rows={toDispatch}
          emptyTitle="Nothing to dispatch"
          emptyDescription="Packed orders waiting to be handed to the courier show up here."
          renderAction={(row) => (
            <StatusActionButton
              orderId={row.orderId}
              label="Mark dispatched"
              icon={Send}
              action={markDispatched}
              successMessage="Order marked as dispatched."
            />
          )}
        />
      </TabsContent>

      <TabsContent value="deliver">
        <OrderGrid
          rows={toDeliver}
          emptyTitle="Nothing out for delivery"
          emptyDescription="Dispatched orders awaiting delivery confirmation show up here."
          renderAction={(row) => (
            <StatusActionButton
              orderId={row.orderId}
              label="Mark delivered"
              icon={CheckCheck}
              action={markDelivered}
              successMessage="Order marked as delivered."
            />
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

function OrderGrid({
  rows,
  emptyTitle,
  emptyDescription,
  renderAction,
}: {
  rows: OrderRow[];
  emptyTitle: string;
  emptyDescription: string;
  renderAction: (row: OrderRow) => React.ReactNode;
}) {
  if (!rows.length) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={PackageSearch}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.orderId}>
          <CardHeader>
            <CardTitle className="text-sm">{row.orderNumber}</CardTitle>
            <p className="text-xs text-muted-foreground">{row.companyName}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-sm">
              {row.items.map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {item.quantity} × {item.productName}
                </p>
              ))}
              <p className="mt-1 font-medium">{formatMoney(row.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">
                Updated {formatDate(row.updatedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {renderAction(row)}
              <PackingLabel
                orderNumber={row.orderNumber}
                companyName={row.companyName}
                address={row.address}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
