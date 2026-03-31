"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

interface GlobalBannerProps {
  message: string;
}

export function GlobalBanner({ message }: GlobalBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setIsVisible(false);
      return;
    }

    // Check if the user has dismissed this specific message
    const dismissedKey = `campusbite_dismissed_banner_${btoa(message).slice(0, 20)}`;
    const isDismissed = localStorage.getItem(dismissedKey) === "true";

    setIsVisible(!isDismissed);
  }, [message]);

  const handleDismiss = () => {
    setIsVisible(false);
    const dismissedKey = `campusbite_dismissed_banner_${btoa(message).slice(0, 20)}`;
    localStorage.setItem(dismissedKey, "true");
  };

  if (!message || !isVisible) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[100] w-full bg-blue-500 overflow-hidden shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
      <div className="relative px-4 py-3 sm:px-6 flex items-start sm:items-center justify-between gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 min-w-0 pr-8">
          <div className="bg-white/20 p-1.5 rounded-full shrink-0 animate-pulse">
            <Megaphone size={16} className="text-white" />
          </div>
          <p className="text-sm font-bold text-white tracking-tight leading-tight pt-0.5 sm:pt-0">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
