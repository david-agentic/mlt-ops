"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingCart, Loader2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/format";
import { createOrder } from "@/lib/actions/orders";
import { toast } from "sonner";
import type { Product } from "@/db/schema";

export function CatalogCart({ products }: { products: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();

  const cartItems = useMemo(
    () =>
      products
        .map((p) => ({ product: p, quantity: quantities[p.id] || 0 }))
        .filter((i) => i.quantity > 0),
    [products, quantities],
  );

  const total = cartItems.reduce(
    (sum, i) => sum + Number(i.product.unitPrice) * i.quantity,
    0,
  );

  function setQuantity(id: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  function handlePlaceOrder() {
    if (!cartItems.length) return;
    startTransition(async () => {
      try {
        await createOrder(
          cartItems.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        );
      } catch (err) {
        if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
          toast.error(err.message);
        }
      }
    });
  }

  if (!products.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products available"
        description="The catalog is empty right now. Check back soon or contact your account manager."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <Card className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-tight">{product.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                {product.description}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {formatMoney(product.unitPrice)}
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    / {product.unit}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setQuantity(product.id, (quantities[product.id] || 0) - 1)
                    }
                  >
                    <Minus />
                  </Button>
                  <Input
                    className="h-7 w-12 text-center"
                    type="number"
                    min={0}
                    value={quantities[product.id] || 0}
                    onChange={(e) =>
                      setQuantity(product.id, Number(e.target.value) || 0)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setQuantity(product.id, (quantities[product.id] || 0) + 1)
                    }
                  >
                    <Plus />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <ShoppingCart className="size-4" />
          <span className="font-medium">Your order</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {cartItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add products to build an order.
              </p>
            )}
            {cartItems.map((item) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.quantity} × {item.product.name}
                </span>
                <span className="text-muted-foreground">
                  {formatMoney(Number(item.product.unitPrice) * item.quantity)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex w-full justify-between border-t border-border pt-3 text-sm font-medium">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <Button
            className="w-full"
            disabled={!cartItems.length || pending}
            onClick={handlePlaceOrder}
          >
            {pending && <Loader2 className="animate-spin" />}
            Place order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
