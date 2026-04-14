"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Slider } from "@/components/ui/slider";
import { ArrowUp, ArrowDown, Minus, ChevronDown } from "lucide-react";
import {
  interleaveWithAds,
  type AppAd,
  type InterleavedEntry,
} from "@/lib/ads";
import { SponsoredCard } from "./SponsoredCard";

interface Category {
  id: string;
  name: string;
}

interface TrendItem {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  is_veg: boolean;
  kiosk_name: string;
  likes: number;
  dislikes: number;
  want_to_try: number;
  total: number;
}

type TimePeriod = "daily" | "weekly" | "monthly";
type SortBy = "likes" | "dislikes" | "want_to_try";

interface TrendsClientProps {
  categories: Category[];
  maxPrice: number;
  userId: string;
  ads: AppAd[];
}

export function TrendsClient({
  categories,
  maxPrice,
  userId,
  ads,
}: TrendsClientProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("likes");
  const [sortOpen, setSortOpen] = useState(false);
  const [items, setItems] = useState<TrendItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const PAGE_SIZE = 20;

  useEffect(() => {
    const syncVegPreference = () => {
      setVegOnly(localStorage.getItem("campusbite_veg_only") === "true");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "campusbite_veg_only") {
        setVegOnly(event.newValue === "true");
      }
    };

    syncVegPreference();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncVegPreference);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncVegPreference);
    };
  }, []);

  const getTimeStart = useCallback((period: TimePeriod) => {
    const now = new Date();
    switch (period) {
      case "daily":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "weekly":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "monthly":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, []);

  const fetchItems = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return;
      setLoading(true);

      const timeStart = getTimeStart(timePeriod);

      // Build query: get items with swipe counts
      const query = supabase
        .from("swipes")
        .select(
          "item_id, direction, items!inner(id, name, price, image_url, is_veg, category_id, kiosk_id, is_available, deleted_at, kiosks(name))"
        )
        .gte("created_at", timeStart);

      const { data: rawSwipes } = await query;

      if (!rawSwipes) {
        setLoading(false);
        setHasMore(false);
        return;
      }

      // Aggregate swipes by item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemMap = new Map<string, any>();

      for (const swipe of rawSwipes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = swipe.items as any;
        if (!item || item.deleted_at || !item.is_available) continue;
        if (vegOnly && !item.is_veg) continue;
        if (selectedCategory && item.category_id !== selectedCategory) continue;
        if (item.price !== null && item.price > priceMax) continue;

        const id = item.id as string;
        if (!itemMap.has(id)) {
          itemMap.set(id, {
            id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            is_veg: item.is_veg,
            kiosk_name: item.kiosks?.name ?? "Unknown",
            likes: 0,
            dislikes: 0,
            want_to_try: 0,
            total: 0,
          });
        }

        const entry = itemMap.get(id)!;
        entry.total++;
        if (swipe.direction === "like") entry.likes++;
        else if (swipe.direction === "dislike") entry.dislikes++;
        else if (swipe.direction === "want_to_try") entry.want_to_try++;
      }

      // Sort
      const sorted = Array.from(itemMap.values());
      sorted.sort((a, b) => b[sortBy] - a[sortBy]);

      // Paginate
      const start = pageNum * PAGE_SIZE;
      const paged = sorted.slice(start, start + PAGE_SIZE);

      if (reset) {
        setItems(paged);
      } else {
        setItems((prev) => [...prev, ...paged]);
      }

      setHasMore(start + PAGE_SIZE < sorted.length);
      setLoading(false);
    },
    [
      timePeriod,
      selectedCategory,
      priceMax,
      vegOnly,
      sortBy,
      supabase,
      getTimeStart,
      loading,
    ]
  );

  // Reset and re-fetch on filter change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchItems(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, selectedCategory, priceMax, vegOnly, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchItems]);

  const sortLabels: Record<SortBy, string> = {
    likes: "Most Liked",
    dislikes: "Most Disliked",
    want_to_try: "Most Anticipated",
  };

  const getRankStyle = (rank: number) => {
    if (rank <= 3) {
      return "lume-glow glass-card-strong rounded-2xl p-4 flex items-center gap-5 relative overflow-hidden";
    }
    return "bg-surface-container-low rounded-2xl p-4 flex items-center gap-5";
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return "text-primary-container font-black italic";
    return "text-on-surface/50 font-bold";
  };

  const feedEntries = interleaveWithAds(items, ads) as InterleavedEntry<TrendItem>[];
  let contentRank = 0;

  return (
    <div className="px-6 space-y-8 pb-8">
      {/* Header */}
      <section className="pt-4">
        <h2 className="text-4xl font-bold tracking-tight text-on-surface">
          Trending Now
        </h2>
        <p className="text-on-surface/50 text-sm mt-2">
          The most popular picks across campus right now.
        </p>
      </section>

      {/* Filters */}
      <section className="space-y-6">
        {/* Time Filter */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {(["daily", "weekly", "monthly"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 whitespace-nowrap capitalize ${
                timePeriod === period
                  ? "bg-primary-container text-surface-dim"
                  : "bg-surface-container-highest text-on-surface/60"
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-xl text-xs uppercase tracking-widest whitespace-nowrap font-bold transition-all ${
              !selectedCategory
                ? "border-2 border-primary/40 text-primary"
                : "border border-outline-variant text-on-surface/50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-xl text-xs uppercase tracking-widest whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat.id
                  ? "border-2 border-primary/40 text-primary font-bold"
                  : "border border-outline-variant text-on-surface/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Price Slider */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold uppercase tracking-tighter text-on-surface/60">
              Price Range
            </label>
            <span className="text-primary font-bold text-lg">
              ₹0 — ₹{priceMax}
            </span>
          </div>
          <Slider
            defaultValue={[maxPrice]}
            max={maxPrice}
            min={0}
            step={10}
            onValueChange={(val) => setPriceMax(Array.isArray(val) ? val[0] : val)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-on-surface/40 font-medium">
            <span>₹0</span>
            <span>₹{maxPrice}</span>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex justify-end relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1 text-sm text-primary font-bold"
          >
            {sortLabels[sortBy]}
            <ChevronDown size={16} />
          </button>
          {sortOpen && (
            <div className="absolute top-8 right-0 z-20 bg-surface-container rounded-xl shadow-lg overflow-hidden min-w-[180px]">
              {(Object.keys(sortLabels) as SortBy[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSortBy(key);
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    sortBy === key
                      ? "bg-primary-container/20 text-primary font-bold"
                      : "text-on-surface hover:bg-surface-container-highest"
                  }`}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ranked List */}
      <section className="space-y-4">
        {feedEntries.map((entry, index) => {
          if (entry.kind === "ad") {
            return (
              <SponsoredCard
                key={`ad-${entry.ad.id}-${index}`}
                ad={entry.ad}
                placement="trends_inline"
                userId={userId}
                variant="inline"
              />
            );
          }

          const item = entry.item;
          contentRank += 1;
          const rank = contentRank;
          return (
            <div key={item.id} className={getRankStyle(rank)}>
              {/* Large faded rank number for top 3 */}
              {rank <= 3 && (
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <span className="text-6xl font-black italic tracking-tighter">
                    {String(rank).padStart(2, "0")}
                  </span>
                </div>
              )}

              {/* Rank */}
              <div
                className={`${getRankColor(rank)} ${
                  rank <= 3 ? "text-3xl" : "text-xl"
                } w-8 shrink-0`}
              >
                #{rank}
              </div>

              {/* Image */}
              <div
                className={`${
                  rank <= 3 ? "w-20 h-20" : "w-14 h-14"
                } rounded-xl overflow-hidden shrink-0 ${
                  rank <= 3 ? "ring-1 ring-primary/20" : "opacity-80"
                }`}
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-container/40 to-primary/20 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-bold text-on-surface truncate ${
                    rank <= 3 ? "text-lg leading-tight" : "text-sm"
                  }`}
                >
                  {item.name}
                </h4>
                <p
                  className={`text-on-surface/50 ${
                    rank <= 3 ? "text-xs mb-3" : "text-[10px] mb-1"
                  }`}
                >
                  {item.kiosk_name}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-green-500">
                    <ArrowUp size={12} />
                    <span
                      className={`font-bold ${
                        rank <= 3 ? "text-xs" : "text-[9px]"
                      }`}
                    >
                      {item.likes}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <ArrowDown size={12} />
                    <span
                      className={`font-bold ${
                        rank <= 3 ? "text-xs" : "text-[9px]"
                      }`}
                    >
                      {item.dislikes}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Minus size={12} />
                    <span
                      className={`font-bold ${
                        rank <= 3 ? "text-xs" : "text-[9px]"
                      }`}
                    >
                      {item.want_to_try}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-on-surface/40">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-bold">No trends yet</p>
            <p className="text-sm">Swipe more items to see trends!</p>
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </div>
  );
}
