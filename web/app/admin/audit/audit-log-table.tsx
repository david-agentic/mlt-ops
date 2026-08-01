"use client";

import { ShieldCheck } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type AuditRow = {
  id: string;
  action: string;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  targetName: string | null;
  targetEmail: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  login_success: "Login succeeded",
  login_failed: "Login failed",
  login_locked_out: "Account locked (too many attempts)",
  logout: "Logout",
  password_changed: "Password changed (self)",
  password_reset_requested: "Password reset requested",
  password_reset_completed: "Password reset completed",
  password_reset_by_admin: "Password reset by admin",
  user_created: "User created",
  user_updated: "User updated",
  user_role_changed: "Role changed",
  user_disabled: "User disabled",
  user_enabled: "User enabled",
  user_deleted: "User deleted",
  invitation_sent: "Invitation sent",
  invitation_accepted: "Invitation accepted",
};

const SEVERE_ACTIONS = new Set([
  "login_locked_out",
  "user_deleted",
  "user_disabled",
]);

const columns: ColumnDef<AuditRow, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "action",
    header: "Event",
    cell: ({ row }) => (
      <Badge variant={SEVERE_ACTIONS.has(row.original.action) ? "outline" : "default"}>
        {ACTION_LABELS[row.original.action] ?? row.original.action}
      </Badge>
    ),
  },
  {
    id: "actor",
    header: "By",
    cell: ({ row }) =>
      row.original.actorName ? (
        <span>
          {row.original.actorName}{" "}
          <span className="text-muted-foreground">({row.original.actorEmail})</span>
        </span>
      ) : (
        <span className="text-muted-foreground">System</span>
      ),
  },
  {
    id: "target",
    header: "Target",
    cell: ({ row }) =>
      row.original.targetName ? (
        <span>
          {row.original.targetName}{" "}
          <span className="text-muted-foreground">({row.original.targetEmail})</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.ipAddress ?? "—"}</span>
    ),
  },
];

export function AuditLogTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No audit events yet"
        description="Logins, password changes, and user-management actions will show up here as they happen."
      />
    );
  }

  return <DataTable columns={columns} data={rows} emptyMessage="No audit events yet." />;
}
