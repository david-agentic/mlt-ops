import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resellers } from "@/db/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ResellerDialog } from "./reseller-dialog";
import { ResellersTable } from "./resellers-table";

export default async function AdminResellersPage() {
  const allResellers = await db
    .select()
    .from(resellers)
    .orderBy(desc(resellers.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Resellers" }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Resellers</h1>
        <ResellerDialog />
      </div>
      <ResellersTable data={allResellers} />
    </div>
  );
}
