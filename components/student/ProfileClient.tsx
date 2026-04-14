"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FeedbackModal } from "./FeedbackModal";
import Link from "next/link";
import { ChevronRight, ListTodo } from "lucide-react";
import { pickTopAd, type AppAd } from "@/lib/ads";
import { SponsoredCard } from "./SponsoredCard";

interface ProfileProps {
  userId: string;
  profile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  stats: {
    liked: number;
    disliked: number;
    want_to_try: number;
  };
  ads: AppAd[];
}

interface HistoryItem {
  id: string;
  item_id: string;
  name: string;
  image_url: string | null;
  is_veg: boolean;
  kiosk_id: string;
  direction: "like" | "dislike";
}

export function ProfileClient({ userId, profile, stats, ads }: ProfileProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"like" | "dislike">("like");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [vegOnly, setVegOnly] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState<HistoryItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 20;
  const featuredAd = pickTopAd(ads);

  // Init veg-only from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("campusbite_veg_only");
    if (stored === "true") setVegOnly(true);
  }, []);

  const handleVegToggle = () => {
    const newVal = !vegOnly;
    setVegOnly(newVal);
    localStorage.setItem("campusbite_veg_only", String(newVal));
    // Set cookie for SSR filtering
    document.cookie = `veg_only=${newVal}; path=/; max-age=${365 * 24 * 60 * 60}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const fetchHistory = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return;
      setLoading(true);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("swipes")
        .select("id, item_id, direction, items(id, name, image_url, is_veg, kiosk_id)")
        .eq("user_id", userId)
        .eq("direction", activeTab)
        .order("created_at", { ascending: false })
        .range(from, to);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: HistoryItem[] = ((data ?? []) as any[])
        .map((s) => ({
          id: s.id,
          item_id: s.items?.id ?? s.item_id,
          name: s.items?.name ?? "Unknown Item",
          image_url: s.items?.image_url ?? null,
          is_veg: (s.items?.is_veg as boolean) ?? false,
          kiosk_id: s.items?.kiosk_id ?? "",
          direction: s.direction as "like" | "dislike",
        }))
        .filter((item) => !vegOnly || item.is_veg);

      if (reset) {
        setHistoryItems(items);
      } else {
        setHistoryItems((prev) => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setLoading(false);
    },
    [activeTab, userId, supabase, loading, vegOnly]
  );

  // Reset on tab change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setHistoryItems([]);
    fetchHistory(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, vegOnly]);

  // Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchHistory(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchHistory]);

  return (
    <>
      <div className="px-5 space-y-8 pb-8">
        {/* Header */}
        <header className="flex justify-between items-center pt-2">
          <h1 className="font-bold text-lg text-on-surface">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 active:scale-95 transition-all"
          >
            <span className="text-xs tracking-wider uppercase font-bold">
              Logout
            </span>
            <LogOut size={14} />
          </button>
        </header>

        {/* Account */}
        <section className="flex items-center gap-4">
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary-container"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-container-highest border-2 border-primary-container flex items-center justify-center text-2xl font-bold text-primary-container">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
              {profile.full_name}
            </h2>
            <p className="text-on-surface/50 text-sm font-medium">
              {profile.email}
            </p>
          </div>
        </section>

        {/* Activity Overview */}
        <div className="bg-surface-container rounded-2xl p-5 space-y-4 glow-border">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface/50">
            Activity Overview
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-container-high px-4 py-2.5 rounded-full flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                {stats.liked} Liked
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
            <div className="bg-surface-container-high px-4 py-2.5 rounded-full flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                {stats.disliked} Disliked
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </div>
            <div className="bg-surface-container-high px-4 py-2.5 rounded-full flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                {stats.want_to_try} Want to Try
              </span>
              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            </div>
          </div>
        </div>

        {/* Wishlist Link */}
        <div className="bg-surface-container rounded-2xl p-2 glow-border" style={{ marginTop: '1rem' }}>
          <Link
            href="/student/profile/wishlist"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-highest/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[0.8rem] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <ListTodo size={20} />
              </div>
              <div>
                <p className="font-bold text-on-surface tracking-wide">My Wishlist</p>
                <p className="text-[11px] text-on-surface/50 font-medium">
                  {stats.want_to_try} places you want to visit
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
              <ChevronRight size={16} className="text-on-surface/50" />
            </div>
          </Link>
        </div>

        {featuredAd && (
          <SponsoredCard
            ad={featuredAd}
            placement="profile_slot"
            userId={userId}
            variant="spotlight"
          />
        )}

        {/* Veg Only Toggle */}
        <div className="bg-surface-container rounded-2xl p-5 flex justify-between items-center glow-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥦</span>
            <span className="font-bold text-on-surface">Veg Only Mode</span>
          </div>
          <button
            onClick={handleVegToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              vegOnly ? "bg-primary-container" : "bg-surface-container-highest"
            }`}
          >
            <div
              className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                vegOnly ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        {/* History Tabs */}
        <section className="space-y-6">
          <div className="flex items-center gap-8 border-b border-outline-variant/10">
            <button
              onClick={() => setActiveTab("like")}
              className={`pb-3 font-bold tracking-wide transition-all ${
                activeTab === "like"
                  ? "text-primary-container border-b-2 border-primary-container font-extrabold"
                  : "text-on-surface/40"
              }`}
            >
              Liked
            </button>
            <button
              onClick={() => setActiveTab("dislike")}
              className={`pb-3 font-bold tracking-wide transition-all ${
                activeTab === "dislike"
                  ? "text-primary-container border-b-2 border-primary-container font-extrabold"
                  : "text-on-surface/40"
              }`}
            >
              Disliked
            </button>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-3 gap-3">
            {historyItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setFeedbackItem(item)}
                className="space-y-2 group text-left"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-container/30 to-primary/10 flex items-center justify-center">
                      <span className="text-3xl">🍽️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <p className="text-[10px] font-bold text-center text-on-surface truncate uppercase tracking-tighter">
                  {item.name}
                </p>
              </button>
            ))}
          </div>

          {/* Empty */}
          {!loading && historyItems.length === 0 && (
            <div className="text-center py-12 text-on-surface/40">
              <p className="text-3xl mb-2">
                {activeTab === "like" ? "💚" : "💔"}
              </p>
              <p className="text-sm">
                No {activeTab === "like" ? "liked" : "disliked"} items yet
              </p>
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

      {/* Feedback Modal */}
      {feedbackItem && (
        <FeedbackModal
          item={feedbackItem}
          userId={userId}
          onClose={() => setFeedbackItem(null)}
        />
      )}
    </>
  );
}
