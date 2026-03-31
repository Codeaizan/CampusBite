import { SkeletonPulse, SkeletonMetricCard } from "@/components/ui/skeleton";

export default function AdminKiosksLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonPulse className="h-10 w-52" />
          <SkeletonPulse className="h-4 w-72" />
        </div>
        <SkeletonPulse className="h-12 w-36 rounded-full" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Table */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
