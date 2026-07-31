import type { LucideIcon } from "lucide-react";
import { Illustration } from "@/components/illustration";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustrationUrl,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Already-resolved URL (see lib/illustrations.ts), computed server-side. */
  illustrationUrl?: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      {illustrationUrl ? (
        <Illustration src={illustrationUrl} alt="" width={160} height={160} />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
