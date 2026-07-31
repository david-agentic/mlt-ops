import { PageHeaderSkeleton, MetricRowSkeleton } from "@/components/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeaderSkeleton />
      <MetricRowSkeleton tiles={6} />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
