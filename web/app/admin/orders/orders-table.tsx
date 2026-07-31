"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatMoney, formatDate } from "@/lib/format";

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
  return (
    <DataTable columns={columns} data={data} emptyMessage="No orders yet." />
  );
}
