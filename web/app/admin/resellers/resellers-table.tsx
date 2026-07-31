"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { ResellerDialog } from "./reseller-dialog";
import { CreateLoginDialog } from "./create-login-dialog";
import { toggleResellerActive } from "@/lib/actions/resellers";
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
        <CreateLoginDialog
          resellerId={row.original.id}
          resellerName={row.original.companyName}
        />
        <ResellerDialog reseller={row.original} />
        <ToggleActiveButton
          id={row.original.id}
          active={row.original.active}
          entityLabel="Reseller"
          onToggle={toggleResellerActive}
        />
      </div>
    ),
  },
];

export function ResellersTable({ data }: { data: Reseller[] }) {
  return (
    <DataTable columns={columns} data={data} emptyMessage="No resellers yet." />
  );
}
