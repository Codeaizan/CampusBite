import { SkeletonPulse } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function LiveMapLoading() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="shrink-0 flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonPulse className="h-10 w-40" />
          <SkeletonPulse className="h-4 w-72" />
        </div>
        <SkeletonPulse className="h-9 w-36 rounded-full" />
      </header>

      <div className="flex-1 min-h-[400px] flex items-center justify-center bg-surface-container rounded-3xl border border-outline-variant/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-container animate-spin" />
          <p className="text-on-surface/60 font-medium">Loading map...</p>
        </div>
      </div>
    </div>
  );
}
