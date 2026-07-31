import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CatalogCart } from "./catalog-cart";

export default async function ResellerCatalogPage() {
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.active, true));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Build your order and submit it for processing.
        </p>
      </div>
      <CatalogCart products={activeProducts} />
    </div>
  );
}
