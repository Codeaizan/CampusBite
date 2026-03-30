"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CreatePollModalProps {
  kioskId: string;
  hasActivePoll: boolean;
  onClose: () => void;
  onCreated: (poll: {
    id: string;
    question: string;
    options: string[];
    votes: { option_index: number; count: number }[];
  }) => void;
}

export function CreatePollModal({
  kioskId,
  hasActivePoll,
  onClose,
  onCreated,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, value: string) => {
    setOptions(options.map((o, i) => (i === idx ? value : o)));
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError("Question is required.");
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError("At least 2 options required.");
      return;
    }
    if (hasActivePoll) {
      setError("End your current poll before creating a new one.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("polls")
      .insert({
        kiosk_id: kioskId,
        question: question.trim(),
        options: validOptions,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create poll.");
      setSubmitting(false);
      return;
    }

    onCreated({
      id: data.id,
      question: question.trim(),
      options: validOptions,
      votes: [],
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-lg bg-surface rounded-t-[2rem] z-10 flex flex-col"
          style={{ boxShadow: "0 0 40px rgba(59, 130, 246, 0.1)" }}
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full" />
          </div>

          <header className="flex items-center justify-between px-6 py-4">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-bright/40">
              <X size={20} className="text-on-surface" />
            </button>
            <h1 className="font-bold text-lg text-on-surface">New Poll</h1>
            <div className="w-10" />
          </header>

          <main className="px-6 py-6 space-y-6 pb-32">
            {/* Question */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface/60 uppercase tracking-wide ml-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What new cuisine should we add?"
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface/60 uppercase tracking-wide ml-1">
                Options
              </label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-surface-container-high border-none rounded-xl py-3 px-5 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 4 && (
                <button
                  onClick={addOption}
                  className="flex items-center gap-2 text-blue-400 font-bold text-sm hover:text-blue-300 transition-colors"
                >
                  <Plus size={14} />
                  Add Option
                </button>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            )}
          </main>

          <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent pt-12">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Launch Poll"}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
