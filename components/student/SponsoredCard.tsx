"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AdPlacement, AppAd } from "@/lib/ads";

type SponsoredCardVariant = "inline" | "swipe" | "spotlight";

interface SponsoredCardProps {
  ad: AppAd;
  placement: AdPlacement;
  userId: string;
  variant?: SponsoredCardVariant;
  className?: string;
  trackImpression?: boolean;
}

export function SponsoredCard({
  ad,
  placement,
  userId,
  variant = "inline",
  className,
  trackImpression = true,
}: SponsoredCardProps) {
  const supabase = createClient();
  const impressionLoggedRef = useRef(false);

  const hasClickTarget = Boolean(ad.click_url && ad.click_url.trim().length > 0);

  const cardClass = useMemo(() => {
    if (variant === "swipe") {
      return "relative w-full h-full rounded-[2.5rem] overflow-hidden bg-surface-container-low flex flex-col";
    }
    if (variant === "spotlight") {
      return "rounded-3xl overflow-hidden bg-surface-container glass-card-strong";
    }
    return "rounded-2xl overflow-hidden bg-surface-container";
  }, [variant]);

  const imageWrapClass = useMemo(() => {
    if (variant === "swipe") return "relative h-[60%] w-full";
    if (variant === "spotlight") return "relative h-52 w-full";
    return "relative h-36 sm:h-40 w-full";
  }, [variant]);

  const bodyClass = useMemo(() => {
    if (variant === "swipe") return "flex-1 p-6 bg-surface-container flex flex-col";
    if (variant === "spotlight") return "p-6 space-y-4";
    return "p-4 space-y-2";
  }, [variant]);

  useEffect(() => {
    if (!trackImpression) return;
    if (impressionLoggedRef.current) return;

    impressionLoggedRef.current = true;

    supabase.from("ad_events").insert({
      ad_id: ad.id,
      user_id: userId,
      placement,
      event_type: "impression",
    });
  }, [ad.id, placement, supabase, trackImpression, userId]);

  const handleClick = () => {
    if (!hasClickTarget || !ad.click_url) return;

    supabase.from("ad_events").insert({
      ad_id: ad.id,
      user_id: userId,
      placement,
      event_type: "click",
    });

    window.open(ad.click_url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className={cn(cardClass, className)}>
      <div className={imageWrapClass}>
        <img
          src={ad.image_url}
          alt={ad.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-500/90 text-white text-[10px] font-black uppercase tracking-[0.18em]">
          Sponsored
        </div>
      </div>

      <div className={bodyClass}>
        <h3
          className={cn(
            "text-on-surface font-extrabold tracking-tight",
            variant === "inline" ? "text-base" : "text-xl"
          )}
        >
          {ad.title}
        </h3>

        {ad.description && (
          <p
            className={cn(
              "text-on-surface/60",
              variant === "inline" ? "text-xs leading-relaxed" : "text-sm leading-relaxed"
            )}
          >
            {ad.description}
          </p>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={!hasClickTarget}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ad.cta_label || "Learn More"}
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}
