import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getProductIntelligence } from "@/lib/analytics/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";

export default async function ProductIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  const intel = await getProductIntelligence(id);

  const trend =
    intel.soldThisWeek > intel.soldPreviousWeek
      ? "up"
      : intel.soldThisWeek < intel.soldPreviousWeek
        ? "down"
        : "flat";

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
        </div>
        <Badge variant={product.active ? "default" : "outline"}>
          {product.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Stock on hand" value={String(intel.stockOnHand)} />
        <Stat label="Reserved" value={String(intel.reserved)} hint="Paid, awaiting shipment" />
        <Stat label="Incoming" value={String(intel.incomingStock)} />
        <Stat
          label="Sold this week"
          value={String(intel.soldThisWeek)}
          trailing={
            trend === "up" ? (
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : trend === "down" ? (
              <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
            ) : (
              <Minus className="size-4 text-muted-foreground" />
            )
          }
          hint={`${intel.soldPreviousWeek} last week`}
        />
        <Stat label="Revenue (30d)" value={formatMoney(intel.revenue30d)} />
        <Stat
          label="Margin"
          value={intel.marginPercent !== null ? `${intel.marginPercent.toFixed(0)}%` : "—"}
          hint={intel.marginPercent === null ? "No cost price set" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label="Sell price" value={formatMoney(product.unitPrice)} />
          <Row
            label="Cost price"
            value={product.costPrice ? formatMoney(product.costPrice) : "Not set"}
          />
          <Row label="Unit" value={product.unit} />
          <Row label="Best reseller" value={intel.bestReseller ?? "No sales yet"} />
          {product.description && <Row label="Description" value={product.description} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  trailing,
}: {
  label: string;
  value: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold">{value}</p>
          {trailing}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
