"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreatePollModal } from "./CreatePollModal";
import { Lock, Plus } from "lucide-react";

interface PollVote {
  option_index: number;
  count: number;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: PollVote[];
}

interface HistoryPoll extends Poll {
  created_at: string;
  status: string;
}

interface PollsClientProps {
  kioskId: string;
  isSubscribed: boolean;
  activePoll: Poll | null;
  historyPolls: HistoryPoll[];
}

export function PollsClient({
  kioskId,
  isSubscribed,
  activePoll: initialActive,
  historyPolls: initialHistory,
}: PollsClientProps) {
  const [activePoll, setActivePoll] = useState(initialActive);
  const [history, setHistory] = useState(initialHistory);
  const [showCreate, setShowCreate] = useState(false);
  const supabase = createClient();

  // Realtime vote updates for active poll
  useEffect(() => {
    if (!activePoll?.id || !isSubscribed) return;

    const channel = supabase
      .channel(`poll_votes_${activePoll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${activePoll.id}`,
        },
        (payload) => {
          const optionIndex = payload.new.option_index as number;
          setActivePoll((prev) => {
            if (!prev) return prev;
            const existing = prev.votes.find(
              (v) => v.option_index === optionIndex
            );
            if (existing) {
              return {
                ...prev,
                votes: prev.votes.map((v) =>
                  v.option_index === optionIndex
                    ? { ...v, count: v.count + 1 }
                    : v
                ),
              };
            }
            return {
              ...prev,
              votes: [...prev.votes, { option_index: optionIndex, count: 1 }],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePoll?.id, isSubscribed, supabase]);

  const handleEndPoll = async () => {
    if (!activePoll) return;
    await supabase
      .from("polls")
      .update({ status: "closed" })
      .eq("id", activePoll.id);

    setHistory((prev) => [
      {
        ...activePoll,
        status: "closed",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setActivePoll(null);
  };

  const handlePollCreated = (poll: Poll) => {
    setActivePoll(poll);
    setShowCreate(false);
  };

  const totalVotes = (votes: PollVote[]) =>
    votes.reduce((sum, v) => sum + v.count, 0);

  // Unsubscribed state
  if (!isSubscribed) {
    return (
      <div className="px-6 pt-6 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface/50">
            Active Poll Results
          </h2>
          <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary-container text-xs font-bold uppercase tracking-wider">
            Locked
          </span>
        </div>

        <div className="relative">
          {/* Blurred placeholder */}
          <div className="glass-card-blue rounded-xl p-6 opacity-50 blur-[8px] select-none pointer-events-none">
            <p className="text-lg font-semibold mb-6">
              What new cuisine should we add?
            </p>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-8 bg-white/10 rounded" />
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-card-blue p-8 rounded-2xl text-center max-w-xs border border-blue-500/20">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={28} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Subscribed Plan Required
              </h3>
              <p className="text-on-surface/50 text-sm mb-6 leading-relaxed">
                Upgrade to access Poll Results and student Feedback data.
              </p>
              <button className="w-full py-3 px-6 bg-blue-500 text-white font-bold rounded-full hover:brightness-110 active:scale-95 transition-all">
                Contact Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 pb-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Polls
          </h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              Unlocked
            </span>
            {!activePoll && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Plus size={16} />
                New Poll
              </button>
            )}
          </div>
        </div>

        {/* Active Poll */}
        {activePoll && (
          <div
            className="glass-card-blue rounded-xl p-6 relative overflow-hidden"
            style={{
              border: "1px solid rgba(59, 130, 246, 0.2)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-bold uppercase tracking-wider">
                Live
              </span>
            </div>

            <p className="text-lg font-semibold mb-6 text-on-surface">
              {activePoll.question}
            </p>

            <div className="space-y-6">
              {activePoll.options.map((option, i) => {
                const total = totalVotes(activePoll.votes);
                const voteCount =
                  activePoll.votes.find((v) => v.option_index === i)?.count ??
                  0;
                const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-medium text-on-surface">
                        {option}
                      </span>
                      <span className="text-blue-400 font-bold">{pct}%</span>
                    </div>
                    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-on-surface/40">
                      {voteCount} votes
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-on-surface/40 text-sm font-medium">
                {totalVotes(activePoll.votes)} total votes
              </span>
              <button
                onClick={handleEndPoll}
                className="text-red-400 font-bold text-sm hover:text-red-300 transition-colors"
              >
                End Poll
              </button>
            </div>
          </div>
        )}

        {/* Poll History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface/60">
              Past Polls
            </h3>
            {history.map((poll) => {
              const total = totalVotes(poll.votes);
              const winnerIdx = poll.votes.reduce(
                (best, v) => (v.count > (best?.count ?? 0) ? v : best),
                poll.votes[0]
              )?.option_index;

              return (
                <div
                  key={poll.id}
                  className="bg-surface-container rounded-xl p-4 space-y-3"
                >
                  <p className="font-semibold text-on-surface">
                    {poll.question}
                  </p>
                  <div className="space-y-2">
                    {poll.options.map((opt: string, i: number) => {
                      const votes =
                        poll.votes.find((v) => v.option_index === i)?.count ??
                        0;
                      const isWinner = i === winnerIdx;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span
                            className={`text-sm flex-1 ${
                              isWinner
                                ? "text-blue-400 font-bold"
                                : "text-on-surface/50"
                            }`}
                          >
                            {isWinner && "🏆 "}
                            {opt}
                          </span>
                          <span className="text-xs text-on-surface/40 font-medium">
                            {votes} votes
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface/30">
                    {new Date(poll.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!activePoll && history.length === 0 && (
          <div className="text-center py-16 text-on-surface/40">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-bold">No polls yet</p>
            <p className="text-sm">Create your first poll to engage students!</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePollModal
          kioskId={kioskId}
          hasActivePoll={!!activePoll}
          onClose={() => setShowCreate(false)}
          onCreated={handlePollCreated}
        />
      )}
    </>
  );
}
