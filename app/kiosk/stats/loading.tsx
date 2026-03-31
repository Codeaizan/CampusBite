import { SkeletonPulse, SkeletonMetricCard } from "@/components/ui/skeleton";

export default function KioskStatsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-44" />
        <SkeletonPulse className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      <div className="animate-pulse rounded-3xl bg-surface-container-low p-6 space-y-4">
        <SkeletonPulse className="h-5 w-32" />
        <div className="flex items-end justify-between h-32 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonPulse key={i} className="w-full rounded-t-lg" style={{ height: `${15 + Math.random() * 70}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
