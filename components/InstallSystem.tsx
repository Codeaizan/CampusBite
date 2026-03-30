"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, Plus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallSystem({ swipeCount }: { swipeCount: number }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [prompted, setPrompted] = useState(false);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(navigator as unknown as { standalone?: boolean }).standalone;

  useEffect(() => {
    // Check if already shown
    if (typeof window !== "undefined") {
      if (localStorage.getItem("campusbite_install_shown") === "true") {
        setPrompted(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (prompted || swipeCount < 5) return;

    if (deferredPrompt.current) {
      // Android/Chrome path
      deferredPrompt.current.prompt();
      deferredPrompt.current.userChoice.then(() => {
        deferredPrompt.current = null;
        localStorage.setItem("campusbite_install_shown", "true");
        setPrompted(true);
      });
    } else if (isIOS) {
      // iOS Safari path
      setShowIOSSheet(true);
      localStorage.setItem("campusbite_install_shown", "true");
      setPrompted(true);
    } else {
      // Not installable
      setPrompted(true);
    }
  }, [swipeCount, prompted, isIOS]);

  return (
    <AnimatePresence>
      {showIOSSheet && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowIOSSheet(false)}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="relative w-full max-w-md glass-card-strong rounded-t-3xl p-8 pb-12 space-y-6"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) setShowIOSSheet(false);
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center">
              <div className="w-10 h-1 rounded-full bg-on-surface/20" />
            </div>

            <button
              className="absolute top-4 right-4 text-on-surface/40 hover:text-on-surface"
              onClick={() => setShowIOSSheet(false)}
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-on-surface text-center">
              Add CampusBite to Home Screen
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-surface-container rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <Share size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">Step 1</p>
                  <p className="text-on-surface/50 text-xs">
                    Tap the <strong>Share</strong> button in your browser
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-surface-container rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <Plus size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">Step 2</p>
                  <p className="text-on-surface/50 text-xs">
                    Select <strong>&quot;Add to Home Screen&quot;</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSSheet(false)}
              className="w-full py-3 rounded-full bg-primary-container text-surface-dim font-bold active:scale-95 transition-transform"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
