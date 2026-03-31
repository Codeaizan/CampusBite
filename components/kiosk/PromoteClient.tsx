"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Share2, Store, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PromoteClientProps {
  kioskId: string;
  kioskName: string;
}

export function PromoteClient({ kioskId, kioskName }: PromoteClientProps) {
  const [appUrl, setAppUrl] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine the base URL dynamically based on the current window location
    const base = window.location.origin;
    setAppUrl(`${base}/student/home?kiosk_id=${kioskId}`);
  }, [kioskId]);

  const handleDownload = () => {
    if (!printRef.current) return;
    
    // Convert SVG to canvas and download as PNG
    const svg = printRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));

    // Upscale for high-res printing
    const scale = 4;
    canvas.width = 300 * scale;
    canvas.height = 300 * scale;

    img.onload = () => {
      // Draw a white background first (since SVG is transparent)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const a = document.createElement("a");
      a.download = `QR_${kioskName.replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };

    img.src = `data:image/svg+xml;base64,${svg64}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${kioskName} on CampusBite!`,
          text: "Scan or tap to see our menu and vote on items.",
          url: appUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(appUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (!appUrl) return null; // Wait for mount

  return (
    <div className="px-6 space-y-8 pb-8">
      {/* Header */}
      <section className="pt-2 space-y-1">
        <div className="flex items-center gap-3">
          <Store size={22} className="text-blue-500" />
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Promote Kiosk
          </h2>
        </div>
        <p className="text-on-surface/50 text-sm pl-[34px]">
          Print or share this QR code so students can scan and view only your items.
        </p>
      </section>

      {/* QR Code Card */}
      <div className="bg-surface-container rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-8 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/20 blur-[80px] pointer-events-none" />

        <div className="text-center relative z-10 space-y-2">
          <h3 className="font-black text-2xl text-on-surface">{kioskName}</h3>
          <p className="text-on-surface/50 text-xs font-bold uppercase tracking-widest">
            Scan to view our menu
          </p>
        </div>

        {/* The QR Code (White background for scannability) */}
        <div 
          ref={printRef}
          className="bg-white p-6 rounded-3xl shadow-2xl relative z-10"
        >
          <QRCodeSVG 
            value={appUrl} 
            size={200}
            level="H" // High error correction
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
            imageSettings={{
              src: "/icon-192x192.png", // Next-PWA default icon
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full relative z-10 pt-4 border-t border-outline-variant/10">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-500 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Download</span> PNG
          </button>
          
          <button
            onClick={handleShare}
            className="bg-surface-container-highest text-on-surface font-bold px-6 rounded-full flex items-center justify-center gap-2 hover:bg-surface-bright active:scale-95 transition-all"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Direct Link Info */}
      <div className="bg-surface-container-highest/30 rounded-2xl p-5 border border-outline-variant/10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
          <ExternalLink size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">
            Direct Link
          </p>
          <p className="text-sm font-mono text-on-surface/80 truncate">
            {appUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
