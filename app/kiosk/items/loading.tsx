import { SkeletonPulse, SkeletonMetricCard } from "@/components/ui/skeleton";

export default function KioskItemsLoading() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-11 flex-1 rounded-xl" />
        <div className="flex gap-2">
          <SkeletonPulse className="h-9 w-14 rounded-full" />
          <SkeletonPulse className="h-9 w-16 rounded-full" />
          <SkeletonPulse className="h-9 w-18 rounded-full" />
        </div>
        <SkeletonPulse className="h-11 w-32 rounded-full" />
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 bg-surface-container-low p-4 rounded-xl">
            <SkeletonPulse className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-3 w-20" />
            </div>
            <SkeletonPulse className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
