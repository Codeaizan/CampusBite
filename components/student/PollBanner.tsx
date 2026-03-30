"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Poll {
  id: string;
  question: string;
  options: string[];
}

export function PollBanner({ userId }: { userId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState(false);
  const [visible, setVisible] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadPoll() {
      // Fetch active poll
      const { data: activePoll } = await supabase
        .from("polls")
        .select("id, question, options")
        .eq("status", "active")
        .limit(1)
        .single();

      if (!activePoll) return;

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("id")
        .eq("poll_id", activePoll.id)
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (existingVote) return;

      setPoll({
        id: activePoll.id,
        question: activePoll.question,
        options: (activePoll.options as string[]) || [],
      });
      setVisible(true);
    }

    loadPoll();

    // Realtime subscription for poll changes
    const channel = supabase
      .channel("polls-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => {
          loadPoll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleVote = async (optionIdx: number) => {
    if (!poll) return;

    await supabase.from("poll_votes").insert({
      poll_id: poll.id,
      user_id: userId,
      option_idx: optionIdx,
    });

    setVoted(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!poll || voted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full mb-4 z-10"
        >
          <div className="bg-primary-container/10 border-l-4 border-primary-container rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 lume-glow">
            <p className="text-sm font-bold text-primary tracking-tight">
              {poll.question}
            </p>
            <div className="flex gap-2 flex-wrap">
              {poll.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVote(idx)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full active:scale-95 transition-transform ${
                    idx === 0
                      ? "bg-primary-container text-surface-dim"
                      : "bg-surface-container-highest text-on-surface"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
