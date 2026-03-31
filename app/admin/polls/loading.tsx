import { SkeletonPulse } from "@/components/ui/skeleton";

export default function AdminPollsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonPulse className="h-10 w-48" />
          <SkeletonPulse className="h-4 w-64" />
        </div>
        <SkeletonPulse className="h-12 w-40 rounded-full" />
      </div>

      {/* Active Poll */}
      <div className="space-y-6">
        <SkeletonPulse className="h-4 w-32" />
        <div className="animate-pulse rounded-3xl bg-surface-container-low p-8 space-y-6">
          <SkeletonPulse className="h-6 w-16 rounded-full" />
          <SkeletonPulse className="h-8 w-3/4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Polls */}
      <div className="space-y-4">
        <SkeletonPulse className="h-7 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
