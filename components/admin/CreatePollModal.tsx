"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface CreatePollModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePollModal({ onClose, onCreated }: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);

    // 1. Check if there's already an active poll globally
    const { data: activePoll, error: checkErr } = await supabase
      .from("polls")
      .select("id")
      .eq("status", "active")
      .single();

    if (activePoll && !checkErr) {
      setError("An active poll already exists. Close it first.");
      setLoading(false);
      return;
    }

    // 2. We need the current admin's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. Insert poll
    const { error: insertErr } = await supabase.from("polls").insert({
      question: question.trim(),
      options: filledOptions,
      status: "active",
      created_by: user?.id,
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-3xl p-8 space-y-6 relative"
        style={{
          background: "rgba(58, 57, 57, 0.4)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 181, 252, 0.15)", // Cyan tint for polls
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-on-surface">Create New Poll</h2>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">Poll Question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              placeholder="e.g. What new cuisine should we add?"
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl focus:ring-1 focus:ring-[#00b5fc]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-on-surface/70 text-sm">Options</Label>
              <span className="text-xs text-on-surface/30">
                {options.length} / 4
              </span>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                    placeholder={`Option ${index + 1}`}
                    className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl focus:ring-1 focus:ring-[#00b5fc]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="w-12 h-12 shrink-0 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 4 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-3 border border-dashed border-on-surface/20 rounded-xl text-sm font-medium text-on-surface/50 hover:text-on-surface hover:border-on-surface/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Option
              </button>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl py-2 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00b5fc] text-surface-dim font-bold py-3.5 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 20px rgba(0, 181, 252, 0.2)" }}
          >
            {loading ? "Publishing…" : "Launch Poll"}
          </button>
        </form>
      </div>
    </div>
  );
}
