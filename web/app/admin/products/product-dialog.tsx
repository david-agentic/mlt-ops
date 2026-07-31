"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { toast } from "sonner";
import type { Product } from "@/db/schema";

export function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(product);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEdit && product) {
          await updateProduct(product.id, formData);
        } else {
          await createProduct(formData);
        }
        toast.success(isEdit ? "Product updated." : "Product added.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus /> Add product
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product?.sku}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                placeholder="box, pack, pallet..."
                defaultValue={product?.unit ?? "unit"}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitPrice">Sell price (GBP)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.unitPrice}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="costPrice">Cost price (GBP, optional)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.costPrice ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stockOnHand">Stock on hand</Label>
              <Input
                id="stockOnHand"
                name="stockOnHand"
                type="number"
                step="1"
                min="0"
                defaultValue={product?.stockOnHand ?? 0}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="incomingStock">Incoming stock</Label>
              <Input
                id="incomingStock"
                name="incomingStock"
                type="number"
                step="1"
                min="0"
                defaultValue={product?.incomingStock ?? 0}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
