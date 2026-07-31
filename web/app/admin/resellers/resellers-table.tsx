"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { ResellerDialog } from "./reseller-dialog";
import { CreateLoginDialog } from "./create-login-dialog";
import type { Reseller } from "@/db/schema";

const columns: ColumnDef<Reseller>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.companyName}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.contactName}
        </div>
      </div>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "—",
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <CreateLoginDialog
          resellerId={row.original.id}
          resellerName={row.original.companyName}
        />
        <ResellerDialog reseller={row.original} />
      </div>
    ),
  },
];

export function ResellersTable({ data }: { data: Reseller[] }) {
  return (
    <DataTable columns={columns} data={data} emptyMessage="No resellers yet." />
  );
}
