import { PageHeaderSkeleton, MetricRowSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <MetricRowSkeleton />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <TableSkeleton rows={6} />
        <TableSkeleton rows={3} />
      </div>
    </div>
  );
}
