import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, resellers } from "@/db/schema";
import { OrdersTable } from "./orders-table";

export default async function AdminOrdersPage() {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      companyName: resellers.companyName,
    })
    .from(orders)
    .innerJoin(resellers, eq(orders.resellerId, resellers.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Orders</h1>
      <OrdersTable data={rows} />
    </div>
  );
}
