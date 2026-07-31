"use client";

import { useTransition } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StatusActionButton({
  orderId,
  label,
  icon: Icon,
  action,
  successMessage,
}: {
  orderId: string;
  label: string;
  icon: LucideIcon;
  action: (orderId: string) => Promise<void>;
  successMessage: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await action(orderId);
            toast.success(successMessage);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Something went wrong.",
            );
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Icon />}
      {label}
    </Button>
  );
}
