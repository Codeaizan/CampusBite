"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pickTopAd, type AppAd } from "@/lib/ads";
import { SponsoredCard } from "./SponsoredCard";

interface SwipeStats {
  liked: number;
  disliked: number;
  want_to_try: number;
}

export function DailyLimitScreen({
  userId,
  ads,
}: {
  userId: string;
  ads: AppAd[];
}) {
  const [stats, setStats] = useState<SwipeStats>({
    liked: 0,
    disliked: 0,
    want_to_try: 0,
  });

  const featuredAd = pickTopAd(ads);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).toISOString();

      const { data } = await supabase
        .from("swipes")
        .select("direction")
        .eq("user_id", userId)
        .gte("created_at", startOfDay);

      if (data) {
        const counts: SwipeStats = { liked: 0, disliked: 0, want_to_try: 0 };
        data.forEach((s) => {
          if (s.direction === "like") counts.liked++;
          else if (s.direction === "dislike") counts.disliked++;
          else if (s.direction === "want_to_try") counts.want_to_try++;
        });
        setStats(counts);
      }
    }

    loadStats();
  }, [userId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-12">
      {/* Hero Illustration */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary-container/10 blur-[80px] rounded-full scale-150" />
        <div className="relative z-10 w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-container rounded-full glass-card-strong opacity-40" />
          <Moon size={100} className="relative text-primary" />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">
          You&apos;re all caught up!
        </h2>
        <p className="text-on-surface/50 text-lg leading-relaxed px-4">
          You&apos;ve reached today&apos;s swipe limit. Come back tomorrow to
          discover more food!
        </p>
      </div>

      {/* Stats Chips */}
      <div className="flex flex-wrap justify-center gap-3 w-full">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full shadow-lg">
          <span className="text-sm font-bold text-on-surface">
            {stats.liked} Liked
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full shadow-lg">
          <span className="text-sm font-bold text-on-surface">
            {stats.disliked} Disliked
          </span>
          <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(255,180,171,0.5)]" />
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full shadow-lg">
          <span className="text-sm font-bold text-on-surface">
            {stats.want_to_try} Want to Try
          </span>
          <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        </div>
      </div>

      {featuredAd && (
        <div className="w-full max-w-md">
          <SponsoredCard
            ad={featuredAd}
            placement="daily_limit"
            userId={userId}
            variant="spotlight"
          />
        </div>
      )}
    </div>
  );
}
