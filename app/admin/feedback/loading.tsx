import { SkeletonPulse, SkeletonMetricCard } from "@/components/ui/skeleton";

export default function AdminFeedbackLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="space-y-2">
        <SkeletonPulse className="h-10 w-56" />
        <SkeletonPulse className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>

      <div className="flex gap-3">
        <SkeletonPulse className="h-10 w-40 rounded-xl" />
        <SkeletonPulse className="h-10 w-32 rounded-xl" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
