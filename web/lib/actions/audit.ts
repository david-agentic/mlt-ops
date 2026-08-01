import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "login_locked_out"
  | "logout"
  | "password_changed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_reset_by_admin"
  | "user_created"
  | "user_updated"
  | "user_role_changed"
  | "user_disabled"
  | "user_enabled"
  | "user_deleted"
  | "invitation_sent"
  | "invitation_accepted";

export async function logAudit(entry: {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const headerList = await headers();
  const ipAddress = headerList.get("cf-connecting-ip") ?? headerList.get("x-real-ip");

  await db.insert(auditLog).values({
    actorUserId: entry.actorUserId ?? null,
    targetUserId: entry.targetUserId ?? null,
    action: entry.action,
    metadata: entry.metadata ?? null,
    ipAddress,
  });
}
