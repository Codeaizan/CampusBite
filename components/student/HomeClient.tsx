"use client";

import { useState, useCallback } from "react";
import { CardStack } from "@/components/student/CardStack";
import { PollBanner } from "@/components/student/PollBanner";
import { DailyLimitScreen } from "@/components/student/DailyLimitScreen";
import { InstallSystem } from "@/components/InstallSystem";
import type { FoodItem } from "@/components/student/FoodCard";

interface HomeClientProps {
  items: FoodItem[];
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  hasActivePoll: boolean;
}

export function HomeClient({
  items,
  userId,
  dailyCount,
  dailyLimit,
  hasActivePoll,
}: HomeClientProps) {
  const [limitReached, setLimitReached] = useState(dailyCount >= dailyLimit);
  const [swipeCount, setSwipeCount] = useState(0);

  const handleSwipeComplete = useCallback(() => {
    setSwipeCount((prev) => prev + 1);
  }, []);

  const handleLimitReached = useCallback(() => {
    setLimitReached(true);
  }, []);

  if (limitReached) {
    return (
      <div className="flex flex-col h-[calc(100dvh-96px)] overflow-hidden">
        <DailyLimitScreen userId={userId} />
        <InstallSystem swipeCount={swipeCount} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[calc(100dvh-96px)] overflow-hidden px-4 pt-2"
      style={{ touchAction: "none" }}
    >
      {/* Poll Banner */}
      {hasActivePoll && <PollBanner userId={userId} />}

      {/* Card Stack */}
      <CardStack
        items={items}
        userId={userId}
        dailyCount={dailyCount}
        dailyLimit={dailyLimit}
        onSwipeComplete={handleSwipeComplete}
        onLimitReached={handleLimitReached}
      />

      {/* PWA Install */}
      <InstallSystem swipeCount={swipeCount} />
    </div>
  );
}
