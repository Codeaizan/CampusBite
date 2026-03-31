"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Filter } from "lucide-react";
import { ExportButton } from "./ExportButton";

interface Kiosk {
  id: string;
  name: string;
}

interface Item {
  name: string;
  image_url: string | null;
}

interface Feedback {
  id: string;
  type: "liked" | "disliked";
  comment: string | null;
  created_at: string;
  items: Item;
  kiosks: Kiosk;
}

interface AdminFeedbackClientProps {
  initialFeedback: Feedback[];
  kiosks: Kiosk[];
  metrics: {
    totalLikes: number;
    totalDislikes: number;
  };
}

export function AdminFeedbackClient({
  initialFeedback,
  kiosks,
  metrics,
}: AdminFeedbackClientProps) {
  const [feedback] = useState<Feedback[]>(initialFeedback);
  const [kioskFilter, setKioskFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredFeedback = feedback.filter((f) => {
    if (kioskFilter !== "all" && f.kiosks.id !== kioskFilter) return false;
    if (sentimentFilter === "liked" && f.type !== "liked") return false;
    if (sentimentFilter === "disliked" && f.type !== "disliked") return false;
    return true;
  });

  const visibleFeedback = filteredFeedback.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-extrabold text-[#FF8C00] tracking-tighter">
          Global Feedback
        </h2>
        <ExportButton data={feedback} filename="campusbite_global_feedback" />
      </header>

      {/* Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className="bg-surface-container/60 p-8 rounded-xl shadow-xl border-l-4 border-l-green-500 relative overflow-hidden group"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-green-500">
            <ThumbsUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-on-surface/40 font-medium tracking-wide mb-2 uppercase text-xs">
              Campus Engagement
            </p>
            <h3 className="text-4xl font-black text-on-surface mb-1">
              {metrics.totalLikes.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-3 h-3 rounded-full bg-green-500"
                style={{ boxShadow: "0 0 10px rgba(34,197,94,0.5)" }}
              ></span>
              <span className="text-on-surface/60 font-medium text-sm">
                Total Likes Across Campus
              </span>
            </div>
          </div>
        </div>

        <div
          className="bg-surface-container/60 p-8 rounded-xl shadow-xl border-l-4 border-l-red-500 relative overflow-hidden group"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-red-500">
            <ThumbsDown size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-on-surface/40 font-medium tracking-wide mb-2 uppercase text-xs">
              Quality Monitor
            </p>
            <h3 className="text-4xl font-black text-on-surface mb-1">
              {metrics.totalDislikes.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-3 h-3 rounded-full bg-red-500"
                style={{ boxShadow: "0 0 10px rgba(239,68,68,0.5)" }}
              ></span>
              <span className="text-on-surface/60 font-medium text-sm">
                Total Dislikes Across Campus
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-on-surface/40">
              <Filter size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">
                Filters:
              </span>
            </div>

            <select
              value={kioskFilter}
              onChange={(e) => setKioskFilter(e.target.value)}
              className="bg-surface-container-high border-none text-on-surface text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary-container min-w-[180px]"
            >
              <option value="all">All Kiosks</option>
              {kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-surface-container-high border-none text-on-surface text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary-container min-w-[180px]"
            >
              <option value="all">All Sentiments</option>
              <option value="liked">Liked Only</option>
              <option value="disliked">Disliked Only</option>
            </select>
          </div>
          <p className="text-on-surface/40 text-xs font-medium shrink-0">
            Showing {filteredFeedback.length} entries
          </p>
        </div>

        {/* Feedback List */}
        <div className="flex flex-col gap-4">
          {visibleFeedback.length > 0 ? (
            visibleFeedback.map((f) => (
              <div
                key={f.id}
                className="group bg-surface-container p-6 rounded-xl hover:bg-surface-bright transition-all duration-300 relative shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-primary-container/20 text-primary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {f.kiosks.name}
                      </span>
                      <h4 className="text-lg font-bold text-on-surface tracking-tight truncate">
                        {f.items?.name || "Unknown Item"}
                      </h4>
                      {f.type === "liked" ? (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <ThumbsUp size={12} /> Liked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <ThumbsDown size={12} /> Disliked
                        </span>
                      )}
                    </div>
                    {f.comment && (
                      <p className="text-on-surface/60 italic text-sm leading-relaxed max-w-3xl">
                        &quot;{f.comment}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-on-surface/40 font-medium">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      }).format(new Date(f.created_at))}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-on-surface/40 bg-surface-container rounded-xl">
              <p>No feedback entries match your filters.</p>
            </div>
          )}
        </div>

        {visibleCount < filteredFeedback.length && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setVisibleCount((p) => p + 20)}
              className="bg-surface-container-highest hover:bg-surface-bright text-on-surface px-8 py-3 rounded-full text-sm font-bold transition-all border border-white/5 active:scale-95"
            >
              Load More Entries
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
