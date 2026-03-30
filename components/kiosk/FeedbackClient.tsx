"use client";

import { useState, useEffect } from "react";
import { Lock, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FeedbackItem {
  id: string;
  item_id: string;
  item_name: string;
  item_image: string | null;
  user_id: string;
  type: string;
  comment: string;
  created_at: string;
}

interface FeedbackClientProps {
  kioskId: string;
  isSubscribed: boolean;
  items: { id: string; name: string }[];
  initialFeedback: FeedbackItem[];
}

type TypeFilter = "all" | "liked" | "disliked";

export function FeedbackClient({
  kioskId,
  isSubscribed,
  initialFeedback,
}: FeedbackClientProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const supabase = createClient();

  // Realtime subscription for new feedback
  useEffect(() => {
    if (!isSubscribed) return;

    const channel = supabase
      .channel(`feedback_${kioskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedback",
          filter: `kiosk_id=eq.${kioskId}`,
        },
        async (payload) => {
          // Fetch the item info
          const { data: item } = await supabase
            .from("items")
            .select("name, image_url")
            .eq("id", payload.new.item_id)
            .single();

          const newFeedback: FeedbackItem = {
            id: payload.new.id,
            item_id: payload.new.item_id,
            item_name: item?.name ?? "Unknown",
            item_image: item?.image_url ?? null,
            user_id: payload.new.user_id,
            type: payload.new.type,
            comment: payload.new.comment,
            created_at: payload.new.created_at,
          };

          setFeedback((prev) => [newFeedback, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kioskId, isSubscribed, supabase]);

  const filtered = feedback.filter((f) => {
    if (typeFilter === "liked") return f.type === "liked";
    if (typeFilter === "disliked") return f.type === "disliked";
    return true;
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "Yesterday" : `${days}d ago`;
  };

  // Unsubscribed paywall
  if (!isSubscribed) {
    return (
      <div className="px-6 pt-6 pb-8 relative min-h-[60vh]">
        {/* Blurred content */}
        <div className="opacity-40 blur-[6px] pointer-events-none">
          <h2 className="text-2xl font-bold mb-6">Customer Feedback</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container rounded-2xl p-5 border-l-4 border-blue-500/40"
              >
                <div className="h-4 w-32 bg-white/10 rounded mb-3" />
                <div className="h-3 w-full bg-white/5 rounded mb-2" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <div className="bg-surface-container-high/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl text-center max-w-sm">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={28} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-3">
              Upgrade to Unlock Feedback
            </h2>
            <p className="text-on-surface/50 text-sm mb-6 leading-relaxed">
              Access detailed insights and individual customer reviews to grow
              your business.
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95">
              Contact Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-on-surface">
        Customer Feedback
      </h2>

      {/* Filter pills */}
      <nav className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {(["all", "liked", "disliked"] as TypeFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTypeFilter(tab)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all capitalize active:scale-95 ${
              typeFilter === tab
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "border border-outline-variant text-on-surface/50 hover:bg-white/5"
            }`}
          >
            {tab === "all" ? "All" : tab === "liked" ? "Liked Only" : "Disliked Only"}
          </button>
        ))}
      </nav>

      {/* Feedback Cards */}
      <section className="space-y-4">
        {filtered.map((f) => (
          <div
            key={f.id}
            className={`bg-surface-container rounded-2xl p-5 border-l-4 relative overflow-hidden ${
              f.type === "liked"
                ? "border-blue-500/40"
                : "border-red-400/40"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-on-surface text-lg">
                {f.item_name}
              </h3>
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  f.type === "liked"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {f.type === "liked" ? "Liked" : "Disliked"}
              </span>
            </div>

            <p className="text-on-surface/60 italic text-sm mb-4 leading-relaxed line-clamp-3">
              &ldquo;{f.comment}&rdquo;
            </p>

            <div className="flex items-center gap-2 text-[10px] text-on-surface/30 font-medium uppercase tracking-tighter">
              <Clock size={12} />
              <span>{timeAgo(f.created_at)}</span>
              <span className="ml-2">
                Student #{f.user_id.slice(-4)}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-on-surface/40">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold">No reviews yet</p>
            <p className="text-sm">
              Students will leave feedback after swiping your items.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
