import { SkeletonPulse } from "@/components/ui/skeleton";

export default function TrendsLoading() {
  return (
    <div className="px-6 space-y-8 pb-8">
      {/* Header */}
      <section className="pt-4 space-y-2">
        <SkeletonPulse className="h-10 w-48" />
        <SkeletonPulse className="h-4 w-64" />
      </section>

      {/* Time filter pills */}
      <div className="flex gap-3">
        <SkeletonPulse className="h-10 w-20 rounded-full" />
        <SkeletonPulse className="h-10 w-20 rounded-full" />
        <SkeletonPulse className="h-10 w-24 rounded-full" />
      </div>

      {/* Category pills */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-9 w-16 rounded-xl" />
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-surface-container-low p-4 flex items-center gap-5"
          >
            <SkeletonPulse className="h-8 w-8 rounded-full" />
            <SkeletonPulse className={`${i < 3 ? "h-20 w-20" : "h-14 w-14"} rounded-xl`} />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
