import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The one card shell every dashboard section (Revenue, Pipeline, Insights,
 * Team Workload, ...) renders through, so spacing/title treatment stays
 * identical across widgets instead of each one hand-rolling a header.
 */
export function SectionCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("shadow-card", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-title">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={bodyClassName}>{children}</CardContent>
    </Card>
  );
}
