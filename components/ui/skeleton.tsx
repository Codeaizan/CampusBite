export function SkeletonPulse({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-surface-container-low p-4 space-y-3 ${className}`}
    >
      <SkeletonPulse className="h-4 w-2/3" />
      <SkeletonPulse className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="animate-pulse rounded-xl bg-surface-container-low p-5 space-y-3">
      <SkeletonPulse className="h-3 w-20" />
      <SkeletonPulse className="h-7 w-16" />
    </div>
  );
}
