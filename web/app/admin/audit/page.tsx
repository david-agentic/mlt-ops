import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema";
import { AuditLogTable } from "./audit-log-table";

const AUDIT_LOG_LIMIT = 200;

export default async function AdminAuditPage() {
  const actor = alias(users, "actor");
  const target = alias(users, "target");

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      metadata: auditLog.metadata,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
      actorName: actor.name,
      actorEmail: actor.email,
      targetName: target.name,
      targetEmail: target.email,
    })
    .from(auditLog)
    .leftJoin(actor, eq(auditLog.actorUserId, actor.id))
    .leftJoin(target, eq(auditLog.targetUserId, target.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(AUDIT_LOG_LIMIT);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          The most recent {AUDIT_LOG_LIMIT} security-relevant events — logins, password
          changes, and user management actions.
        </p>
      </div>
      <AuditLogTable rows={rows} />
    </div>
  );
}
