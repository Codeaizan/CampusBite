import { SkeletonPulse } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="px-6 pt-8 space-y-8 pb-8">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-4">
        <SkeletonPulse className="h-24 w-24 rounded-full" />
        <SkeletonPulse className="h-6 w-40" />
        <SkeletonPulse className="h-4 w-52" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-surface-container-low p-4 flex flex-col items-center gap-2"
          >
            <SkeletonPulse className="h-7 w-10" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Settings list */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
