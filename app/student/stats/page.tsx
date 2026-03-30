import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { MousePointerClick, Utensils, BarChart3 } from "lucide-react";

export default async function StatsPage() {
  const supabase = await createClient();

  // Parallel fetches
  const [swipeCountRes, activeItemsRes, topRatedRes, heatmapRes] =
    await Promise.all([
      // Total swipes
      supabase
        .from("swipes")
        .select("id", { count: "exact", head: true }),

      // Active items
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("is_available", true)
        .is("deleted_at", null),

      // Top rated using wilson_score — raw query via RPC or client-side aggregation
      supabase
        .from("swipes")
        .select(
          "direction, items!inner(id, name, price, image_url, kiosk_id, is_available, deleted_at, kiosks(name))"
        ),

      // Rush hour heatmap: swipes grouped by hour
      supabase.from("swipes").select("created_at"),
    ]);

  const totalSwipes = swipeCountRes.count ?? 0;
  const activeItems = activeItemsRes.count ?? 0;

  // Compute wilson scores client-side from swipe data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const swipeData = (topRatedRes.data ?? []) as any[];
  const itemStats = new Map<
    string,
    {
      id: string;
      name: string;
      image_url: string | null;
      price: number | null;
      kiosk_name: string;
      likes: number;
      dislikes: number;
      total: number;
    }
  >();

  for (const swipe of swipeData) {
    const item = swipe.items;
    if (!item || item.deleted_at || !item.is_available) continue;

    const id = item.id as string;
    if (!itemStats.has(id)) {
      itemStats.set(id, {
        id,
        name: item.name,
        image_url: item.image_url,
        price: item.price,
        kiosk_name: item.kiosks?.name ?? "Unknown",
        likes: 0,
        dislikes: 0,
        total: 0,
      });
    }

    const entry = itemStats.get(id)!;
    if (swipe.direction === "like") {
      entry.likes++;
      entry.total++;
    } else if (swipe.direction === "dislike") {
      entry.dislikes++;
      entry.total++;
    }
  }

  // Wilson score calculation (95% CI lower bound)
  function wilsonScore(likes: number, total: number): number {
    if (total === 0) return 0;
    const z = 1.96;
    const p = likes / total;
    const n = total;
    return (
      (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  }

  const topRated = Array.from(itemStats.values())
    .filter((i) => i.total > 0)
    .map((i) => ({
      ...i,
      score: wilsonScore(i.likes, i.total),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Rush hour heatmap
  const hourCounts = new Array(7).fill(0); // 11am-5pm
  for (const swipe of (heatmapRes.data ?? [])) {
    const hour = new Date(swipe.created_at).getHours();
    if (hour >= 11 && hour <= 17) {
      hourCounts[hour - 11]++;
    }
  }
  const maxHourCount = Math.max(...hourCounts, 1);
  const hourLabels = ["11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"];

  const rankBadge = (rank: number) => {
    if (rank === 1)
      return "bg-yellow-500/20 text-yellow-500";
    if (rank === 2)
      return "bg-slate-400/20 text-slate-300";
    if (rank === 3)
      return "bg-amber-700/20 text-amber-600";
    return "bg-surface-container-highest text-on-surface/50";
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-16"
        style={{
          background: "rgba(19,19,19,0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 4px 20px rgba(255, 140, 0, 0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-primary-container" />
          <h1 className="text-primary-container font-bold text-xl tracking-tight">
            Campus Analytics
          </h1>
        </div>
      </header>

      <main className="px-6 space-y-10 pt-6">
        {/* Metrics Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-card-strong p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
                Total Swipes
              </span>
              <MousePointerClick size={20} className="text-primary-container/50" />
            </div>
            <div className="text-2xl font-extrabold text-primary-container">
              {totalSwipes.toLocaleString()}
            </div>
          </div>

          <div className="glass-card-strong p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
                Active Items
              </span>
              <Utensils size={20} className="text-on-surface/50" />
            </div>
            <div className="text-2xl font-extrabold text-on-surface">
              {activeItems.toLocaleString()}
            </div>
          </div>
        </section>

        {/* Top Rated Board */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-on-surface">
            🏆 Top Rated Board
          </h2>

          <div className="space-y-4">
            {topRated.map((item, i) => {
              const rank = i + 1;
              const scorePercent = Math.round(item.score * 100);

              return (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-4 bg-surface-container-low p-4 rounded-xl transition-all hover:bg-surface-container"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-extrabold text-sm ${rankBadge(rank)}`}
                  >
                    {rank}
                  </div>

                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-lg">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-container/40 to-primary/20 flex items-center justify-center">
                        <span className="text-xl">🍽️</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-on-surface font-bold truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-on-surface/40">{item.kiosk_name}</p>
                    <div className="mt-2 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{
                          width: `${scorePercent}%`,
                          boxShadow:
                            rank === 1
                              ? "0 0 8px rgba(255, 140, 0, 0.4)"
                              : undefined,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-primary-container font-bold">
                      {(item.score * 10).toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}

            {topRated.length === 0 && (
              <p className="text-center text-on-surface/40 py-8">
                No ratings yet. Start swiping!
              </p>
            )}
          </div>
        </section>

        {/* Rush Hour Heatmap */}
        <section className="pb-10">
          <div className="glass-card-strong p-6 rounded-3xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold text-on-surface">
                  Rush Hour Heatmap
                </h4>
                <p className="text-xs text-on-surface/40">
                  Peak swiping hours
                </p>
              </div>
              <BarChart3 size={20} className="text-primary-container" />
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {hourCounts.map((count, i) => {
                const height = (count / maxHourCount) * 100;
                const isMax = count === maxHourCount && count > 0;
                return (
                  <div
                    key={i}
                    className={`w-full rounded-t-lg transition-all ${
                      isMax
                        ? "bg-primary-container shadow-[0_0_15px_rgba(255,140,0,0.3)]"
                        : "bg-primary-container/30"
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-on-surface/40 uppercase tracking-tighter">
              {hourLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
