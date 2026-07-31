"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ToggleActiveButton({
  id,
  active,
  entityLabel,
  onToggle,
}: {
  id: string;
  active: boolean;
  /** Shown in the success toast, e.g. "Product", "Reseller", "User" */
  entityLabel: string;
  onToggle: (id: string, active: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await onToggle(id, !active);
            toast.success(`${entityLabel} ${active ? "deactivated" : "activated"}.`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
          }
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
