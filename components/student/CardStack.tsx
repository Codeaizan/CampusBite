"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { FoodCard, type FoodItem } from "./FoodCard";
import { createClient } from "@/lib/supabase/client";

interface CardStackProps {
  items: FoodItem[];
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  onSwipeComplete: () => void;
  onLimitReached: () => void;
}

type SwipeDirection = "like" | "dislike" | "want_to_try";

export function CardStack({
  items: initialItems,
  userId,
  dailyCount: initialDailyCount,
  dailyLimit,
  onSwipeComplete,
  onLimitReached,
}: CardStackProps) {
  const [items, setItems] = useState(initialItems);
  const [dailyCount, setDailyCount] = useState(initialDailyCount);
  const [swiping, setSwiping] = useState(false);

  const supabase = createClient();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);

  const recordSwipe = useCallback(
    async (itemId: string, direction: SwipeDirection) => {
      // Check limit
      if (dailyCount >= dailyLimit) {
        onLimitReached();
        return false;
      }

      // Insert swipe
      await supabase.from("swipes").insert({
        user_id: userId,
        item_id: itemId,
        direction,
      });

      // Upsert daily count
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("daily_swipe_counts").upsert(
        {
          user_id: userId,
          swipe_date: today,
          count: dailyCount + 1,
        },
        { onConflict: "user_id,swipe_date" }
      );

      setDailyCount((prev) => prev + 1);
      onSwipeComplete();
      return true;
    },
    [dailyCount, dailyLimit, userId, supabase, onSwipeComplete, onLimitReached]
  );

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (swiping) return;

      const { offset, velocity } = info;
      const currentItem = items[0];
      if (!currentItem) return;

      let direction: SwipeDirection | null = null;
      let exitX = 0;
      let exitY = 0;

      // Mobile-tuned thresholds (lower for touch)
      const OFFSET_THRESHOLD = 60;
      const VELOCITY_THRESHOLD = 300;
      const MIN_OFFSET = 30;

      // Check vertical first (up = want to try)
      if (
        offset.y < -OFFSET_THRESHOLD ||
        (velocity.y < -VELOCITY_THRESHOLD && offset.y < -MIN_OFFSET)
      ) {
        direction = "want_to_try";
        exitY = -800;
      }
      // Check horizontal
      else if (
        offset.x > OFFSET_THRESHOLD ||
        (velocity.x > VELOCITY_THRESHOLD && offset.x > MIN_OFFSET)
      ) {
        direction = "like";
        exitX = 600;
      } else if (
        offset.x < -OFFSET_THRESHOLD ||
        (velocity.x < -VELOCITY_THRESHOLD && offset.x < -MIN_OFFSET)
      ) {
        direction = "dislike";
        exitX = -600;
      }

      if (direction) {
        setSwiping(true);
        const success = await recordSwipe(currentItem.id, direction);
        if (success) {
          // Animate exit
          if (exitX !== 0) {
            x.set(exitX);
          }
          if (exitY !== 0) {
            y.set(exitY);
          }

          setTimeout(() => {
            setItems((prev) => prev.slice(1));
            x.set(0);
            y.set(0);
            setSwiping(false);
          }, 250);
        } else {
          // Snap back — limit reached
          x.set(0);
          y.set(0);
          setSwiping(false);
        }
      } else {
        // Not enough drag — snap back
        x.set(0);
        y.set(0);
      }
    },
    [items, recordSwipe, x, y, swiping]
  );

  // Empty state
  if (items.length === 0) {
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
      </div>
    );
  }

  // Render top 3 cards
  const visibleCards = items.slice(0, 3);

  return (
    <div className="relative w-full flex-1 flex items-center justify-center">
      <div className="relative w-full" style={{ aspectRatio: "3/4", maxHeight: "calc(100dvh - 200px)" }}>
        <AnimatePresence mode="popLayout">
          {visibleCards
            .map((item, index) => {
              const isTop = index === 0;

              return (
                <motion.div
                  key={item.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: 30 - index * 10,
                    touchAction: "none",
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
                    transition: { duration: 0.2 },
                  }}
                  drag={isTop && !swiping}
                  dragElastic={0.9}
                  dragConstraints={{ top: -200, bottom: 200, left: -200, right: 200 }}
                  dragSnapToOrigin
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  whileDrag={isTop ? { scale: 1.02, cursor: "grabbing" } : undefined}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 350,
                  }}
                >
                  <FoodCard
                    item={item}
                    isTop={isTop}
                    dragX={isTop ? x : undefined}
                    dragY={isTop ? y : undefined}
                  />
                </motion.div>
              );
            })
            .reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
}
