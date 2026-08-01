"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, SearchX, Download } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge, STATUS_LABEL } from "@/components/order-status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string | Date;
  companyName: string;
};

const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  { accessorKey: "companyName", header: "Reseller" },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => formatMoney(row.original.totalAmount),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Placed",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function OrdersTable({ data }: { data: OrderRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of data) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) || o.companyName.toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders yet"
        description="Orders will appear here as soon as a reseller places one."
      />
    );
  }

  function exportCsv() {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order Number", "Reseller", "Status", "Total", "Placed"],
      filtered.map((o) => [
        o.orderNumber,
        o.companyName,
        STATUS_LABEL[o.status] ?? o.status,
        o.totalAmount,
        formatDate(o.createdAt),
      ]),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search order # or reseller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          {ORDER_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {STATUS_LABEL[s]} ({counts[s]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching orders"
          description="Try a different search term or status filter."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No orders yet."
          enableSorting
          enablePagination
          pageSize={25}
        />
      )}
    </div>
  );
}
