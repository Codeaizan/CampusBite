import { SkeletonPulse } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function WishlistLoading() {
  return (
    <div className="min-h-[100dvh] bg-surface-dim text-on-surface pb-[100px]">
      <header
        className="sticky top-0 w-full z-40 flex items-center gap-4 px-6 py-6"
        style={{
          background: "linear-gradient(to bottom, rgba(14,14,14,1) 60%, rgba(14,14,14,0))",
        }}
      >
        <button className="text-on-surface/60 p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <SkeletonPulse className="h-6 w-32" />
      </header>

      <div className="px-6 space-y-4 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 bg-surface-container rounded-2xl">
            <SkeletonPulse className="w-[88px] h-[88px] rounded-xl shrink-0" />
            <div className="flex-1 py-1 space-y-3">
              <SkeletonPulse className="h-4 w-3/4" />
              <div className="space-y-1">
                <SkeletonPulse className="h-3 w-1/2" />
                <SkeletonPulse className="h-3 w-1/3" />
              </div>
            </div>
            <div className="pt-2 pr-1">
              <SkeletonPulse className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
