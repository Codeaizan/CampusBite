import { SkeletonPulse } from "@/components/ui/skeleton";

export default function PromoteLoading() {
  return (
    <div className="px-6 space-y-8 pb-8">
      <section className="pt-2 space-y-1">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-[22px] w-[22px] rounded-lg" />
          <SkeletonPulse className="h-8 w-40" />
        </div>
        <SkeletonPulse className="h-4 w-64 ml-[34px]" />
      </section>

      <div className="bg-surface-container rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-8 shadow-xl">
        <div className="text-center space-y-2 w-full flex flex-col items-center">
          <SkeletonPulse className="h-8 w-48" />
          <SkeletonPulse className="h-3 w-32" />
        </div>

        <SkeletonPulse className="h-[248px] w-[248px] rounded-3xl" />

        <div className="flex gap-4 w-full pt-4 border-t border-outline-variant/10">
          <SkeletonPulse className="flex-1 h-14 rounded-full" />
          <SkeletonPulse className="w-32 h-14 rounded-full" />
        </div>
      </div>

      <div className="bg-surface-container-highest/30 rounded-2xl p-5 border border-outline-variant/10 flex items-center gap-4">
        <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3 w-20" />
          <SkeletonPulse className="h-4 w-full max-w-sm" />
        </div>
      </div>
    </div>
  );
}
