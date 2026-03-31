import { SkeletonPulse } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col h-[calc(100dvh-96px)] overflow-hidden px-4 pt-2">
      {/* Poll banner skeleton */}
      <SkeletonPulse className="h-12 w-full rounded-2xl mb-4" />

      {/* Card skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm aspect-[3/4] animate-pulse rounded-3xl bg-surface-container" />
      </div>
    </div>
  );
}
