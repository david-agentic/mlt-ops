import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { EmptyState } from "@/components/empty-state";
import { illustrationPath } from "@/lib/illustrations";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { ResellerOrdersTable } from "./orders-table";

export default async function ResellerOrdersPage() {
  const user = await requireRole("reseller");

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.resellerId, user.resellerId!))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">My Orders</h1>
      {rows.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          illustrationUrl={illustrationPath("empty-orders.svg")}
          title="No orders yet"
          description="Browse the catalog and place your first order."
          action={
            <Button
              nativeButton={false}
              render={<Link href="/reseller">Browse catalog</Link>}
            />
          }
        />
      ) : (
        <ResellerOrdersTable data={rows} />
      )}
    </div>
  );
}
