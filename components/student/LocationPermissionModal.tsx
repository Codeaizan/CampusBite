"use client";

import { MapPin, X } from "lucide-react";

interface LocationPermissionModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function LocationPermissionModal({
  onAccept,
  onDecline,
}: LocationPermissionModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 p-4 pb-8 backdrop-blur-sm">
      <div
        className="relative w-full overflow-hidden rounded-[2rem] bg-surface-container p-6 animate-in slide-in-from-bottom-8 duration-500 fade-in"
        style={{
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <button
          onClick={onDecline}
          className="absolute right-4 top-4 text-on-surface/40 hover:text-on-surface/80 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6 flex w-full justify-center pt-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container/20 text-primary-container relative">
            <div className="absolute inset-0 rounded-3xl animate-ping bg-primary-container/10"></div>
            <MapPin size={40} />
          </div>
        </div>

        <div className="mb-8 text-center space-y-2">
          <h2 className="text-2xl font-black text-on-surface">
            Turn on Location?
          </h2>
          <p className="text-sm font-medium leading-relaxed text-on-surface/60">
            Share your live location while using the app to help us map the
            campus traffic and show you nearby kiosks.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full rounded-2xl bg-primary-container py-4 font-bold text-surface-dim transition-transform focus:scale-95 active:scale-95 shadow-lg shadow-primary-container/20"
          >
            Allow Location Access
          </button>
          <button
            onClick={onDecline}
            className="w-full rounded-2xl py-4 font-bold text-on-surface/60 transition-colors hover:bg-surface-bright active:scale-95"
          >
            Not Right Now
          </button>
        </div>
      </div>
    </div>
  );
}
