import { createClient } from "@/lib/supabase/server";
import { ThumbsUp, ThumbsDown, Star, Zap } from "lucide-react";

export default async function KioskStatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: kiosk } = await supabase
    .from("kiosks")
    .select("id, name")
    .eq("owner_uid", user.id)
    .is("deleted_at", null)
    .single();

  if (!kiosk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-on-surface/50">No kiosk found. Contact admin.</p>
      </div>
    );
  }

  // Get all kiosk items
  const { data: kioskItems } = await supabase
    .from("items")
    .select("id, name, category_id, categories(name)")
    .eq("kiosk_id", kiosk.id)
    .is("deleted_at", null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (kioskItems ?? []) as any[];
  const itemIds = items.map((i) => i.id as string);

  // Get all swipes for kiosk items
  const { data: swipes } = await supabase
    .from("swipes")
    .select("item_id, direction, created_at")
    .in("item_id", itemIds.length > 0 ? itemIds : ["__none__"]);

  const allSwipes = swipes ?? [];

  // ===== METRICS =====
  const totalSwipes = allSwipes.length;
  const totalLikes = allSwipes.filter((s) => s.direction === "like").length;
  const totalDislikes = allSwipes.filter((s) => s.direction === "dislike").length;
  const totalWantToTry = allSwipes.filter((s) => s.direction === "want_to_try").length;

  // ===== TOP ITEMS =====
  const itemSwipeCounts = new Map<
    string,
    { name: string; likes: number; dislikes: number; want_to_try: number; total: number }
  >();
  for (const item of items) {
    itemSwipeCounts.set(item.id, {
      name: item.name,
      likes: 0,
      dislikes: 0,
      want_to_try: 0,
      total: 0,
    });
  }
  for (const swipe of allSwipes) {
    const entry = itemSwipeCounts.get(swipe.item_id);
    if (!entry) continue;
    entry.total++;
    if (swipe.direction === "like") entry.likes++;
    else if (swipe.direction === "dislike") entry.dislikes++;
    else if (swipe.direction === "want_to_try") entry.want_to_try++;
  }

  const topItems = Array.from(itemSwipeCounts.values())
    .filter((i) => i.total > 0)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  // ===== 7-DAY TREND =====
  const last7Days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayLabel = date.toLocaleDateString("en", { weekday: "short" });
    const count = allSwipes.filter(
      (s) => s.created_at.startsWith(dateStr)
    ).length;
    last7Days.push({ label: dayLabel, count });
  }
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  // ===== CATEGORY BREAKDOWN =====
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    const catName = (item.categories?.name as string) ?? "Uncategorized";
    categoryCounts.set(catName, (categoryCounts.get(catName) ?? 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  const maxCatCount = Math.max(...categoryBreakdown.map((c) => c[1]), 1);

  const metrics = [
    {
      label: "Total Swipes",
      value: totalSwipes,
      icon: <Zap size={24} className="text-blue-500" />,
      tagColor: "text-blue-500/60",
      tag: "Growth",
    },
    {
      label: "Total Likes",
      value: totalLikes,
      icon: <ThumbsUp size={24} className="text-emerald-400" />,
      tagColor: "text-emerald-400/60",
      tag: totalSwipes > 0 ? `${Math.round((totalLikes / totalSwipes) * 100)}%` : "—",
    },
    {
      label: "Total Dislikes",
      value: totalDislikes,
      icon: <ThumbsDown size={24} className="text-rose-500" />,
      tagColor: "text-rose-500/60",
      tag: totalSwipes > 0 ? `${Math.round((totalDislikes / totalSwipes) * 100)}%` : "—",
    },
    {
      label: "Want to Try",
      value: totalWantToTry,
      icon: <Star size={24} className="text-amber-400" />,
      tagColor: "text-amber-400/60",
      tag: "Hot",
    },
  ];

  return (
    <div className="px-6 pt-6 pb-8">
      <h1 className="font-bold text-xl text-on-surface mb-6">
        Your Performance
      </h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="glass-card-blue rounded-3xl p-5 flex flex-col gap-3"
            style={{
              border: "1px solid rgba(59, 130, 246, 0.2)",
              boxShadow:
                m.label === "Total Swipes"
                  ? "0 10px 30px -10px rgba(59, 130, 246, 0.15)"
                  : undefined,
            }}
          >
            <div className="flex justify-between items-start">
              {m.icon}
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${m.tagColor}`}
              >
                {m.tag}
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface">
                {m.value.toLocaleString()}
              </div>
              <div className="text-xs text-on-surface/50 font-medium">
                {m.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Performance */}
      {topItems.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-on-surface mb-6">
            Item Performance
          </h2>
          <div className="flex flex-col gap-6">
            {topItems.map((item) => {
              const likeRate =
                item.total > 0
                  ? Math.round((item.likes / item.total) * 100)
                  : 0;
              const dislikeRate = 100 - likeRate;

              return (
                <div key={item.name} className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">
                        {item.name}
                      </h3>
                      <p className="text-xs text-on-surface/40">
                        {item.total} votes total
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xl font-extrabold ${
                          likeRate >= 50 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {likeRate}%
                      </span>
                      <span className="text-[10px] block text-on-surface/40 font-bold uppercase tracking-wider">
                        Liked
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full flex overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${likeRate}%`,
                        boxShadow: "0 0 10px rgba(16, 185, 129, 0.3)",
                      }}
                    />
                    <div
                      className="h-full bg-rose-500/40"
                      style={{ width: `${dislikeRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Swipe Trend */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-on-surface mb-6">
          Swipe Trend (7 Days)
        </h2>
        <div
          className="glass-card-blue p-6 rounded-3xl"
          style={{ border: "1px solid rgba(59, 130, 246, 0.15)" }}
        >
          <div className="flex items-end justify-between h-32 gap-2">
            {last7Days.map((day, i) => {
              const height = (day.count / maxDayCount) * 100;
              const isMax = day.count === maxDayCount && day.count > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-on-surface/40 font-bold">
                    {day.count > 0 ? day.count : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isMax
                        ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "bg-blue-500/30"
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-on-surface/40 uppercase tracking-tighter">
            {last7Days.map((day) => (
              <span key={day.label}>{day.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-6">
            Category Breakdown
          </h2>
          <div className="space-y-4">
            {categoryBreakdown.map(([name, count]) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface">
                    {name}
                  </span>
                  <span className="text-sm text-on-surface/40 font-medium">
                    {count} items
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(count / maxCatCount) * 100}%`,
                      boxShadow: "0 0 8px rgba(59, 130, 246, 0.2)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
