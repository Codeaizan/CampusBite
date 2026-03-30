"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FeedbackItem {
  id: string;
  name: string;
  image_url: string | null;
  direction: "like" | "dislike";
  kiosk_id: string;
}

interface FeedbackModalProps {
  item: FeedbackItem | null;
  userId: string;
  onClose: () => void;
}

export function FeedbackModal({ item, userId, onClose }: FeedbackModalProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const maxChars = 300;

  const handleSubmit = async () => {
    if (!item || !comment.trim()) return;
    setSubmitting(true);
    setError(null);

    // Check for existing feedback on this item
    const { data: existing } = await supabase
      .from("feedback")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", item.id)
      .limit(1)
      .single();

    if (existing) {
      setError("You already reviewed this item.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("feedback").insert({
      user_id: userId,
      item_id: item.id,
      kiosk_id: item.kiosk_id,
      type: item.direction === "like" ? "liked" : "disliked",
      comment: comment.trim(),
    });

    if (insertError) {
      if (insertError.message.includes("policy") || insertError.code === "42501") {
        setError("Rate limit reached. Try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setTimeout(onClose, 1200);
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <motion.div
          className="relative w-full max-w-md rounded-t-[2.5rem] p-6 flex flex-col items-center z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(58,57,57,0.4) 0%, rgba(32,31,31,0.9) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 -4px 40px rgba(255, 140, 0, 0.12)",
            borderTop: "1px solid rgba(255, 183, 125, 0.1)",
          }}
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) onClose();
          }}
        >
          {/* Drag handle */}
          <div className="w-12 h-1.5 bg-on-surface/20 rounded-full mb-8" />

          {/* Close button */}
          <button
            className="absolute top-5 right-5 text-on-surface/30 hover:text-on-surface"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          {/* Item header */}
          <div className="w-full flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/10 shadow-lg">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-container/40 to-primary/20 flex items-center justify-center">
                  <span className="text-3xl">🍽️</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-on-surface font-bold text-xl tracking-tight mb-1">
                {item.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  item.direction === "like"
                    ? "bg-green-700/20 text-green-400"
                    : "bg-red-700/20 text-red-400"
                }`}
              >
                {item.direction === "like" ? "👍 Liked" : "👎 Disliked"}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="w-full mb-4">
            <h2 className="text-on-surface font-bold text-2xl tracking-tight leading-tight">
              Why did you {item.direction === "like" ? "like" : "dislike"} this?
            </h2>
          </div>

          {/* Textarea */}
          <div className="w-full relative mb-8">
            <textarea
              className="w-full h-40 bg-surface-container-highest/40 border border-outline-variant/30 rounded-[1.5rem] p-5 text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50 transition-all resize-none leading-relaxed"
              placeholder="Write your review here..."
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setComment(e.target.value);
                }
              }}
            />
            <div className="absolute bottom-4 right-5 text-on-surface/40 text-xs font-medium tracking-widest uppercase">
              {comment.length}/{maxChars}
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <p className="w-full text-red-400 text-sm font-medium mb-4 text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="w-full text-green-400 text-sm font-medium mb-4 text-center">
              ✅ Review submitted!
            </p>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col items-center gap-6 pb-6">
            <button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim() || success}
              className="w-full py-4 bg-primary-container text-surface-dim font-extrabold text-lg rounded-full active:scale-95 transition-transform disabled:opacity-50"
              style={{
                boxShadow: "0 8px 24px rgba(255, 140, 0, 0.2)",
              }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={onClose}
              className="text-on-surface/40 font-medium tracking-wide text-sm hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
