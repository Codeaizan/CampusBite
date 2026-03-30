"use client";

import Image from "next/image";
import { MotionValue, useTransform, useMotionValue, motion } from "framer-motion";
import { MapPin } from "lucide-react";

export interface FoodItem {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  is_veg: boolean;
  kiosk_name: string;
  kiosk_location: string | null;
}

interface FoodCardProps {
  item: FoodItem;
  dragX?: MotionValue<number>;
  dragY?: MotionValue<number>;
  isTop?: boolean;
}

export function FoodCard({
  item,
  dragX,
  dragY,
  isTop = false,
}: FoodCardProps) {
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);

  // Swipe stamp opacities derived from drag values
  const likeOpacity = useTransform(dragX ?? fallbackX, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(dragX ?? fallbackX, [-100, 0], [1, 0]);
  const tryOpacity = useTransform(dragY ?? fallbackY, [-100, 0], [1, 0]);

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col bg-surface-container-low">
      {/* Image Area (60%) */}
      <div className="relative h-[60%] w-full">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={isTop}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-container/40 to-primary/20 flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Glass overlay gradient */}
        <div className="absolute inset-0 glass-overlay" />

        {/* Price chip */}
        {item.price !== null && (
          <div className="absolute top-4 right-4 bg-surface-bright/20 backdrop-blur-md px-3 py-1.5 rounded-full">
            <span className="text-primary-container font-bold text-sm tracking-tight">
              ₹{item.price}
            </span>
          </div>
        )}

        {/* Veg/Non-veg badge */}
        <div className="absolute top-4 left-4 glass-card-strong rounded-lg w-8 h-8 flex items-center justify-center">
          <div
            className={`w-3 h-3 rounded-full ${
              item.is_veg
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            }`}
          />
        </div>
      </div>

      {/* Content Area (40%) */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-surface-container">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight leading-tight truncate mb-1">
            {item.name}
          </h2>
          <div className="flex items-center gap-1.5 text-on-surface/50">
            <MapPin size={14} />
            <span className="text-sm font-medium truncate">
              {item.kiosk_name}
              {item.kiosk_location ? ` - ${item.kiosk_location}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Swipe Overlays (only on top/active card) */}
      {isTop && (
        <>
          {/* LIKE stamp */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            <div className="stamp-like px-6 py-2 rounded-xl text-4xl font-black tracking-widest bg-surface/10 backdrop-blur-[2px]">
              LIKE 👍
            </div>
          </motion.div>

          {/* NOPE stamp */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            <div className="stamp-nope px-6 py-2 rounded-xl text-4xl font-black tracking-widest bg-surface/10 backdrop-blur-[2px]">
              NOPE 👎
            </div>
          </motion.div>

          {/* TRY stamp */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: tryOpacity }}
          >
            <div className="stamp-try px-6 py-2 rounded-xl text-4xl font-black tracking-widest bg-surface/10 backdrop-blur-[2px]">
              TRY ⭐
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
