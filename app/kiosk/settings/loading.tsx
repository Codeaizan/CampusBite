import { SkeletonPulse } from "@/components/ui/skeleton";

export default function KioskSettingsLoading() {
  return (
    <div className="px-6 space-y-8 pb-8">
      <section className="pt-2 space-y-1">
        <SkeletonPulse className="h-7 w-44" />
        <SkeletonPulse className="h-4 w-56" />
      </section>

      <div className="animate-pulse rounded-3xl bg-surface-container p-6 space-y-6">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-3 w-52" />
          </div>
        </div>
        <SkeletonPulse className="h-14 w-full rounded-xl" />
        <SkeletonPulse className="h-12 w-full rounded-xl" />
        <SkeletonPulse className="h-12 w-full rounded-full" />
      </div>

      <div className="animate-pulse rounded-3xl bg-surface-container p-6 space-y-4">
        <SkeletonPulse className="h-4 w-28" />
        <SkeletonPulse className="h-14 w-full rounded-xl" />
        <SkeletonPulse className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
