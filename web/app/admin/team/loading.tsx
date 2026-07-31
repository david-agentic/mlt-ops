import { PageHeaderSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} />
    </div>
  );
}
