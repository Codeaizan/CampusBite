import { SkeletonPulse } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <SkeletonPulse className="h-10 w-36" />
        <SkeletonPulse className="h-4 w-56" />
      </div>

      {/* Daily Swipe Limit */}
      <div className="animate-pulse rounded-3xl bg-surface-container-low p-8 space-y-6">
        <SkeletonPulse className="h-6 w-40" />
        <SkeletonPulse className="h-4 w-60" />
        <div className="flex items-center gap-4">
          <SkeletonPulse className="h-12 w-20 rounded-xl" />
          <SkeletonPulse className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Categories */}
      <div className="animate-pulse rounded-3xl bg-surface-container-low p-8 space-y-6">
        <SkeletonPulse className="h-6 w-32" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
