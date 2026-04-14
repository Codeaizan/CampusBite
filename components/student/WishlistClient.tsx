"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, MapPin, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { interleaveWithAds, type AppAd } from "@/lib/ads";
import { SponsoredCard } from "./SponsoredCard";

interface WishlistItem {
  swipe_id: string;
  item_id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  is_veg: boolean;
  kiosk_id: string;
  kiosk_name: string;
  kiosk_location: string;
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
  userId: string;
  ads: AppAd[];
}

export function WishlistClient({ initialItems, userId, ads }: WishlistClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [vegOnly, setVegOnly] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

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

  const visibleItems = vegOnly ? items.filter((item) => item.is_veg) : items;
  const feedEntries = interleaveWithAds(visibleItems, ads);

  const handleRemove = async (swipeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic remove
    setRemovingIds((prev) => new Set(prev).add(swipeId));

    const { error } = await supabase
      .from("swipes")
      .delete()
      .eq("id", swipeId)
      .eq("user_id", userId);

    if (error) {
      // Revert if error
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(swipeId);
        return next;
      });
      return;
    }

    // Fully remove from state
    setItems((prev) => prev.filter((item) => item.swipe_id !== swipeId));
  };

  return (
    <div className="min-h-[100dvh] bg-surface-dim text-on-surface pb-[100px]">
      {/* Header */}
      <header
        className="sticky top-0 w-full z-40 flex items-center gap-4 px-6 py-6"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,14,14,1) 60%, rgba(14,14,14,0))",
        }}
      >
        <button
          onClick={() => router.back()}
          className="text-on-surface/60 hover:text-on-surface p-2 -ml-2 rounded-full transition-colors active:scale-95 bg-surface-container"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">My Wishlist</h1>
        <span className="ml-auto text-xs font-bold text-on-surface/40 bg-surface-container px-3 py-1 rounded-full">
          {visibleItems.length} items
        </span>
      </header>

      {/* List */}
      <div className="px-6 space-y-4 pt-2">
        {visibleItems.length === 0 ? (
          <div className="text-center py-20 text-on-surface/40">
            <div className="text-5xl mb-4 opacity-50">🧭</div>
            <p className="font-bold text-lg text-on-surface mb-1">
              {items.length === 0 ? "Your wishlist is empty" : "No veg items in your wishlist"}
            </p>
            <p className="text-sm max-w-[250px] mx-auto leading-relaxed">
              {items.length === 0
                ? "Swipe UP (Want to Try) on the home screen to save items for later."
                : "Turn off Veg Only mode in Profile to view all saved items."}
            </p>
          </div>
        ) : (
          feedEntries.map((entry, index) => {
            if (entry.kind === "ad") {
              return (
                <SponsoredCard
                  key={`ad-${entry.ad.id}-${index}`}
                  ad={entry.ad}
                  placement="wishlist_inline"
                  userId={userId}
                  variant="inline"
                />
              );
            }

            const item = entry.item;
            const isRemoving = removingIds.has(item.swipe_id);

            return (
              <div
                key={item.swipe_id}
                className={`flex bg-surface-container rounded-2xl overflow-hidden transition-all duration-300 ${
                  isRemoving ? "opacity-0 scale-95 origin-center" : "opacity-100"
                }`}
                style={{
                  border: "1px solid rgba(255,255,255,0.03)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                {/* Image */}
                <div className="relative w-[110px] sm:w-[130px] shrink-0">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 110px, 130px"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-3xl">
                      🍽️
                    </div>
                  )}
                  {/* Veg Indicator */}
                  <div
                    className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full z-10 ${
                      item.is_veg
                        ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                        : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container" />
                </div>

                {/* Content */}
                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center relative">
                  <h3 className="font-extrabold text-on-surface tracking-tight leading-tight mb-2 pr-8">
                    {item.name}
                  </h3>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-on-surface/50">
                      <Store size={12} className="shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {item.kiosk_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface/40">
                      <MapPin size={12} className="shrink-0" />
                      <span className="text-[10px] uppercase tracking-widest font-bold truncate">
                        {item.kiosk_location}
                      </span>
                    </div>
                  </div>

                  {item.price !== null && (
                    <span className="absolute bottom-3 right-4 text-primary-container font-black text-sm">
                      ₹{item.price}
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(item.swipe_id, e)}
                    disabled={isRemoving}
                    title="Remove from wishlist"
                    className="absolute top-2 right-2 p-2 rounded-full text-on-surface/30 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
