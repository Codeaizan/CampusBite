"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(
  () => import("@/components/admin/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-surface-container rounded-3xl border border-outline-variant/10">
        <Loader2 className="w-10 h-10 text-primary-container animate-spin mb-4" />
        <p className="text-on-surface/60 font-medium">Booting Satellite Feed...</p>
      </div>
    ),
  }
);

export function LiveMapClient() {
  return (
    <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
      {/* Header */}
      <header className="shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">
            Live Radar
          </h2>
          <p className="text-on-surface/40 mt-2 font-medium">
            Real-time geospatial tracking of active campus traffic.
          </p>
        </div>
        <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-green-500/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Feed Active
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 w-full min-h-[400px] relative">
        <MapComponent />
      </div>
    </div>
  );
}
