"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleProductActive } from "@/lib/actions/products";
import { toast } from "sonner";

export function ToggleActiveButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleProductActive(id, !active);
          toast.success(active ? "Product deactivated." : "Product activated.");
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
