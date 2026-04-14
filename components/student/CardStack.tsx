"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { FoodCard, type FoodItem } from "./FoodCard";
import { createClient } from "@/lib/supabase/client";
import {
  interleaveWithAds,
  pickTopAd,
  type AppAd,
  type InterleavedEntry,
} from "@/lib/ads";
import { SponsoredCard } from "./SponsoredCard";

interface CardStackProps {
  items: FoodItem[];
  ads: AppAd[];
  allCaughtUpAds: AppAd[];
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  onSwipeComplete: () => void;
  onLimitReached: () => void;
}

type SwipeDirection = "like" | "dislike" | "want_to_try";

type SwipeRpcResult = {
  ok?: boolean;
  reason?: "limit_reached" | "already_swiped" | "unauthenticated" | "forbidden" | "db_error";
  count?: number;
};

export function CardStack({
  items: initialItems,
  ads,
  allCaughtUpAds,
  userId,
  dailyCount: initialDailyCount,
  dailyLimit,
  onSwipeComplete,
  onLimitReached,
}: CardStackProps) {
  const [entries, setEntries] = useState<InterleavedEntry<FoodItem>[]>(() =>
    interleaveWithAds(initialItems, ads)
  );
  const [dailyCount, setDailyCount] = useState(initialDailyCount);
  const swipingRef = useRef(false);

  const supabase = createClient();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  useEffect(() => {
    setEntries(interleaveWithAds(initialItems, ads));
  }, [initialItems, ads]);

  useEffect(() => {
    setDailyCount(initialDailyCount);
  }, [initialDailyCount]);

  const legacyRecordSwipe = useCallback(
    async (itemId: string, direction: SwipeDirection) => {
      if (dailyCount >= dailyLimit) {
        onLimitReached();
        return false;
      }

      const today = new Date().toISOString().split("T")[0];

      const { error: swipeError } = await supabase.from("swipes").insert({
        user_id: userId,
        item_id: itemId,
        direction,
      });

      if (swipeError) {
        if (swipeError.code !== "23505") {
          console.error("Legacy swipe insert failed:", swipeError.message);
        }
        return false;
      }

      const nextCount = dailyCount + 1;
      const { error: countError } = await supabase
        .from("daily_swipe_counts")
        .upsert(
          {
            user_id: userId,
            swipe_date: today,
            count: nextCount,
          },
          { onConflict: "user_id,swipe_date" }
        );

      if (countError) {
        console.error("Legacy daily count upsert failed:", countError.message);
      }

      setDailyCount((prev) => prev + 1);
      onSwipeComplete();
      return true;
    },
    [dailyCount, dailyLimit, onLimitReached, onSwipeComplete, supabase, userId]
  );

  const recordSwipe = useCallback(
    async (itemId: string, direction: SwipeDirection) => {
      // Check limit synchronously
      if (dailyCount >= dailyLimit) {
        onLimitReached();
        return false;
      }

      const { data, error } = await supabase.rpc("record_swipe_with_limit", {
        p_item_id: itemId,
        p_direction: direction,
        p_daily_limit: dailyLimit,
      });

      if (error) {
        console.error("record_swipe_with_limit failed:", error.message);
        // Fallback keeps swiping functional if the migration wasn't applied yet.
        return legacyRecordSwipe(itemId, direction);
      }

      const result = data as SwipeRpcResult | null;
      if (!result?.ok) {
        if (result?.reason === "limit_reached") {
          if (typeof result.count === "number") {
            setDailyCount(result.count);
          }
          onLimitReached();
        }
        if (result?.reason === "db_error") {
          return legacyRecordSwipe(itemId, direction);
        }
        return false;
      }

      if (typeof result.count === "number") {
        setDailyCount(result.count);
      } else {
        setDailyCount((prev) => prev + 1);
      }

      onSwipeComplete();
      return true;
    },
    [
      dailyCount,
      dailyLimit,
      legacyRecordSwipe,
      onLimitReached,
      onSwipeComplete,
      supabase,
    ]
  );

  const removeTopCard = useCallback(() => {
    setEntries((prev) => prev.slice(1));
    x.set(0);
    y.set(0);
    swipingRef.current = false;
  }, [x, y]);

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (swipingRef.current) return;

      const { offset, velocity } = info;
      const currentEntry = entries[0];
      if (!currentEntry) return;

      let direction: SwipeDirection | null = null;
      let exitX = 0;
      let exitY = 0;

      // Responsive thresholds — lower = more responsive
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 250;
      const MIN_OFFSET = 25;

      // Check vertical first (up = want to try)
      if (
        offset.y < -SWIPE_THRESHOLD ||
        (velocity.y < -VELOCITY_THRESHOLD && offset.y < -MIN_OFFSET)
      ) {
        direction = "want_to_try";
        exitY = -1000;
        exitX = offset.x * 2; // Maintain horizontal momentum
      }
      // Check horizontal
      else if (
        offset.x > SWIPE_THRESHOLD ||
        (velocity.x > VELOCITY_THRESHOLD && offset.x > MIN_OFFSET)
      ) {
        direction = "like";
        exitX = 800;
        exitY = offset.y; // Maintain vertical angle
      } else if (
        offset.x < -SWIPE_THRESHOLD ||
        (velocity.x < -VELOCITY_THRESHOLD && offset.x < -MIN_OFFSET)
      ) {
        direction = "dislike";
        exitX = -800;
        exitY = offset.y;
      }

      if (direction) {
        swipingRef.current = true;

        if (currentEntry.kind === "content") {
          // Record swipe atomically in DB before removing the card.
          const success = await recordSwipe(currentEntry.item.id, direction);
          if (!success) {
            // Snap back — limit reached
            animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
            animate(y, 0, { type: "spring", stiffness: 500, damping: 35 });
            swipingRef.current = false;
            return;
          }
        }

        // Animate the card out with velocity-based physics
        const exitDuration = 0.2;
        animate(x, exitX, {
          duration: exitDuration,
          ease: [0.32, 0.72, 0, 1],
          onComplete: removeTopCard,
        });
        animate(y, exitY, {
          duration: exitDuration,
          ease: [0.32, 0.72, 0, 1],
        });
      } else {
        // Not enough drag — spring back smoothly
        animate(x, 0, { type: "spring", stiffness: 600, damping: 30 });
        animate(y, 0, { type: "spring", stiffness: 600, damping: 30 });
      }
    },
    [entries, recordSwipe, x, y, removeTopCard]
  );

  const allCaughtUpAd = pickTopAd(allCaughtUpAds);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary-container/10 blur-[60px] rounded-full scale-150" />
          <span className="relative text-7xl">🎉</span>
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-2">
          You&apos;ve seen everything!
        </h2>
        <p className="text-on-surface/50 text-sm leading-relaxed max-w-[250px]">
          Check back tomorrow for new items from campus kiosks.
        </p>

        {allCaughtUpAd && (
          <div className="w-full max-w-md mt-8">
            <SponsoredCard
              ad={allCaughtUpAd}
              placement="all_caught_up"
              userId={userId}
              variant="spotlight"
            />
          </div>
        )}
      </div>
    );
  }

  // Render top 3 cards
  const visibleCards = entries.slice(0, 3);

  return (
    <div className="relative w-full flex-1 flex items-center justify-center">
      <div className="relative w-full" style={{ aspectRatio: "3/4", maxHeight: "calc(100dvh - 200px)" }}>
        <AnimatePresence mode="popLayout">
          {visibleCards
            .map((entry, index) => {
              const isTop = index === 0;
              const cardKey =
                entry.kind === "content"
                  ? `food-${entry.item.id}-${index}`
                  : `ad-${entry.ad.id}-${index}`;

              return (
                <motion.div
                  key={cardKey}
                  className="absolute inset-0"
                  style={{
                    zIndex: 30 - index * 10,
                    touchAction: "none",
                    willChange: isTop ? "transform" : "auto",
                    ...(isTop ? { x, y, rotate } : {}),
                  }}
                  initial={{
                    scale: 1 - index * 0.05,
                    y: index * 12,
                    opacity: 1 - index * 0.25,
                  }}
                  animate={{
                    scale: 1 - index * 0.05,
                    y: index * 12,
                    opacity: 1 - index * 0.25,
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15 },
                  }}
                  drag={isTop && !swipingRef.current}
                  dragElastic={0.7}
                  dragConstraints={{ top: -300, bottom: 300, left: -300, right: 300 }}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  whileDrag={isTop ? { scale: 1.03, cursor: "grabbing" } : undefined}
                  transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 400,
                    mass: 0.8,
                  }}
                >
                  {entry.kind === "content" ? (
                    <FoodCard
                      item={entry.item}
                      isTop={isTop}
                      dragX={isTop ? x : undefined}
                      dragY={isTop ? y : undefined}
                    />
                  ) : (
                    <SponsoredCard
                      ad={entry.ad}
                      placement="swipe_deck"
                      userId={userId}
                      variant="swipe"
                      trackImpression={isTop}
                    />
                  )}
                </motion.div>
              );
            })
            .reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
}
