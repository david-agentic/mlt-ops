import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductDialog } from "./product-dialog";
import { ProductsTable } from "./products-table";

export default async function AdminProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Products" }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Products</h1>
        <ProductDialog />
      </div>
      <ProductsTable data={allProducts} />
    </div>
  );
}
