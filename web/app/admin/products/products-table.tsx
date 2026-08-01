"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/format";
import { ProductDialog } from "./product-dialog";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { toggleProductActive } from "@/lib/actions/products";
import type { Product } from "@/db/schema";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.sku}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/admin/products/${row.original.id}`}
        className="block hover:underline"
      >
        <div className="font-medium">{row.original.name}</div>
        {row.original.description && (
          <div className="text-xs text-muted-foreground">
            {row.original.description}
          </div>
        )}
      </Link>
    ),
  },
  {
    accessorKey: "stockOnHand",
    header: "Stock",
    cell: ({ row }) => row.original.stockOnHand,
  },
  {
    accessorKey: "unitPrice",
    header: "Unit price",
    cell: ({ row }) => formatMoney(row.original.unitPrice),
  },
  { accessorKey: "unit", header: "Unit" },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "outline"}>
        {row.original.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <ProductDialog product={row.original} />
        <ToggleActiveButton
          id={row.original.id}
          active={row.original.active}
          entityLabel="Product"
          onToggle={toggleProductActive}
        />
      </div>
    ),
  },
];

export function ProductsTable({ data }: { data: Product[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products yet"
        description="Add your first product to start building your catalog."
        action={<ProductDialog />}
      />
    );
  }

  return <DataTable columns={columns} data={data} emptyMessage="No products yet." />;
}
