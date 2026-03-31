import { SkeletonPulse, SkeletonMetricCard } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-16"
        style={{
          background: "rgba(19,19,19,0.8)",
          backdropFilter: "blur(24px)",
        }}
      >
        <SkeletonPulse className="h-6 w-40" />
      </header>

      <main className="px-6 space-y-10 pt-6">
        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </section>

        {/* Top Rated */}
        <section className="space-y-6">
          <SkeletonPulse className="h-7 w-44" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-4 bg-surface-container-low p-4 rounded-xl"
              >
                <SkeletonPulse className="h-8 w-8 rounded-full" />
                <SkeletonPulse className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-4 w-28" />
                  <SkeletonPulse className="h-3 w-20" />
                  <SkeletonPulse className="h-1 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Heatmap */}
        <section>
          <div className="animate-pulse rounded-3xl bg-surface-container-low p-6">
            <SkeletonPulse className="h-5 w-40 mb-6" />
            <div className="flex items-end justify-between h-32 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonPulse
                  key={i}
                  className="w-full rounded-t-lg"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
