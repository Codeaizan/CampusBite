"use client";

import { useState, useEffect } from "react";
import { Plus, History, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreatePollModal } from "./CreatePollModal";
import { ExportButton } from "./ExportButton";

interface Poll {
  id: string;
  question: string;
  options: string[];
  status: "active" | "closed";
  created_at: string;
  closed_at: string | null;
}

interface PollStats {
  id: string;
  poll_id: string;
  option_idx: number;
}

interface AdminPollsClientProps {
  initialActivePoll: Poll | null;
  initialActiveVotes: Record<number, number>;
  initialPastPolls: Poll[];
  initialPastVotes: Record<string, Record<number, number>>;
}

export function AdminPollsClient({
  initialActivePoll,
  initialActiveVotes,
  initialPastPolls,
  initialPastVotes,
}: AdminPollsClientProps) {
  const [activePoll, setActivePoll] = useState<Poll | null>(initialActivePoll);
  const [activeVotes, setActiveVotes] =
    useState<Record<number, number>>(initialActiveVotes);
  const [pastPolls, setPastPolls] = useState<Poll[]>(initialPastPolls);
  const [showCreate, setShowCreate] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!activePoll) return;

    const channel = supabase
      .channel("admin-poll-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${activePoll.id}`,
        },
        (payload) => {
          const newVote = payload.new as PollStats;
          setActiveVotes((prev) => ({
            ...prev,
            [newVote.option_idx]: (prev[newVote.option_idx] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePoll, supabase]);

  const handleClosePoll = async () => {
    if (!activePoll) return;

    const { error } = await supabase
      .from("polls")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", activePoll.id);

    if (!error) {
      // Move to past polls
      setPastPolls((prev) => [activePoll, ...prev]);
      setActivePoll(null);
      // We keep the old past votes statically, no need to inject the active votes because it will refresh on page load anyway.
    }
  };

  const handlePollCreated = async () => {
    setShowCreate(false);
    // Refresh active poll
    const { data: poll } = await supabase
      .from("polls")
      .select("*")
      .eq("status", "active")
      .single();

    if (poll) {
      setActivePoll(poll as Poll);
      setActiveVotes({});
    }
  };

  // Helper config
  const totalActiveVotes = Object.values(activeVotes).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">
              Poll Manager
            </h2>
            <p className="text-on-surface/40 mt-2 font-medium">
              Gather insights and community preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={pastPolls} filename="campusbite_past_polls" />
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#00b5fc] text-surface-dim px-6 py-3 rounded-full font-bold transition-all active:scale-95"
              style={{ boxShadow: "0 8px 20px rgba(0, 181, 252, 0.2)" }}
            >
              <Plus size={18} /> Create New Poll
            </button>
          </div>
        </header>

        {/* Active Poll Section */}
        {activePoll ? (
          <section className="mb-16">
            <h3 className="text-xs font-bold tracking-widest text-[#00b5fc] uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00b5fc] animate-pulse"></span>
              Currently Active
            </h3>

            <div
              className="bg-surface-container rounded-3xl p-8 relative overflow-hidden active-glow"
              style={{
                boxShadow: "0 0 20px rgba(0, 181, 252, 0.15)",
                border: "1px solid rgba(0, 181, 252, 0.1)",
              }}
            >
              {/* Background Accent Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00b5fc]/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                <div className="flex-1 max-w-2xl w-full">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold tracking-widest uppercase mb-4 border border-green-500/20">
                    LIVE
                  </div>
                  <h4 className="text-3xl font-bold leading-tight mb-8 text-on-surface">
                    {activePoll.question}
                  </h4>

                  {/* Progress Bars Component */}
                  <div className="space-y-6">
                    {activePoll.options.map((option, idx) => {
                      const votes = activeVotes[idx] || 0;
                      const percentage =
                        totalActiveVotes === 0
                          ? 0
                          : Math.round((votes / totalActiveVotes) * 100);

                      // Only highlight the leader if there's at least 1 vote
                      const isLeader =
                        totalActiveVotes > 0 &&
                        votes === Math.max(...Object.values(activeVotes));

                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-sm font-bold mb-2 text-on-surface">
                            <span>{option}</span>
                            <span
                              className={
                                isLeader ? "text-[#00b5fc]" : "text-on-surface/80"
                              }
                            >
                              {percentage}%{" "}
                              <span className="text-on-surface/40 font-normal ml-2">
                                ({votes} votes)
                              </span>
                            </span>
                          </div>
                          <div className="h-3 w-full bg-surface-bright rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isLeader ? "bg-[#00b5fc]" : "bg-on-surface/20"
                              }`}
                              style={{
                                width: `${percentage}%`,
                                boxShadow: isLeader
                                  ? "0 0 10px rgba(0,181,252,0.5)"
                                  : "none",
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-on-surface/40 text-sm font-medium">
                    <span className="font-bold">Total Votes:</span>{" "}
                    {totalActiveVotes}
                  </div>
                </div>

                <div className="flex flex-col gap-4 min-w-[200px] shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={handleClosePoll}
                    className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Close Poll
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <h3 className="text-xs font-bold tracking-widest text-[#00b5fc] uppercase mb-6">
              Currently Active
            </h3>
            <div className="bg-surface-container rounded-3xl p-12 text-center border border-outline-variant/10">
              <p className="text-on-surface/40 font-medium">
                No active poll. Click &quot;Create New Poll&quot; to start one.
              </p>
            </div>
          </section>
        )}

        {/* Past Polls Section */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-2xl font-bold text-on-surface">Past Polls</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pastPolls.length > 0 ? (
              pastPolls.map((poll) => {
                const votesMap = initialPastVotes[poll.id] || {};
                const maxVotes = Math.max(...Object.values(votesMap), 0);
                const winnerIdx = parseInt(
                  Object.keys(votesMap).find(
                    (k) => votesMap[Number(k)] === maxVotes
                  ) || "0"
                );
                const winnerText = poll.options[winnerIdx] || "No votes";
                const totalVotes = Object.values(votesMap).reduce(
                  (a, b) => a + b,
                  0
                );
                const winnerPct =
                  totalVotes === 0
                    ? 0
                    : Math.round((maxVotes / totalVotes) * 100);

                const dateDisplay = poll.closed_at
                  ? new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(poll.closed_at))
                  : "Recently";

                return (
                  <div
                    key={poll.id}
                    className="bg-surface-container hover:bg-surface-container-highest transition-colors p-6 rounded-2xl flex items-center justify-between group border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-bright flex items-center justify-center text-on-surface/40 group-hover:text-[#00b5fc] transition-colors">
                        <History size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-on-surface/40 font-medium mb-1 uppercase tracking-wider text-[10px]">
                          Closed {dateDisplay}
                        </p>
                        <h5 className="text-lg font-bold text-on-surface">
                          {poll.question}
                        </h5>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-on-surface/40 font-medium mb-1">
                        Final Result
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[#00b5fc] font-bold">
                          {totalVotes > 0
                            ? `${winnerText} (${winnerPct}%)`
                            : "No votes"}
                        </span>
                        <ChevronRight className="text-on-surface/40" size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-on-surface/40">
                <p>No past polls found.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreated={handlePollCreated}
        />
      )}
    </>
  );
}
