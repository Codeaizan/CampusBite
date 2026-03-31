import { SkeletonPulse } from "@/components/ui/skeleton";

export default function KioskFeedbackLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-44" />
        <SkeletonPulse className="h-4 w-60" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
