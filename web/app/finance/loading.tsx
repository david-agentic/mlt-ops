import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={3} />
    </div>
  );
}
