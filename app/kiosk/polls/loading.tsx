import { SkeletonPulse } from "@/components/ui/skeleton";

export default function KioskPollsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-32" />
        <SkeletonPulse className="h-4 w-56" />
      </div>

      <div className="animate-pulse rounded-3xl bg-surface-container-low p-8 space-y-6">
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-7 w-3/4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
