"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AddKioskModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function AddKioskModal({ onClose, onCreated }: AddKioskModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Look up owner by email
    const { data: owner } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", ownerEmail)
      .single();

    if (!owner) {
      setError("No user found with this email.");
      setLoading(false);
      return;
    }

    if (owner.role !== "kiosk_owner") {
      setError("This user is not a kiosk owner. Change their role first.");
      setLoading(false);
      return;
    }

    // Insert kiosk
    const { data: kiosk, error: insertErr } = await supabase
      .from("kiosks")
      .insert({
        name,
        location,
        owner_id: owner.id,
        is_subscribed: subscribed,
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    // Link kiosk to profile
    await supabase
      .from("profiles")
      .update({ kiosk_id: kiosk.id })
      .eq("id", owner.id);

    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-3xl p-8 space-y-6 relative"
        style={{
          background: "rgba(58, 57, 57, 0.4)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 183, 125, 0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-on-surface">Add New Kiosk</h2>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">Kiosk Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Punjabi Tadka"
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl focus:ring-1 focus:ring-primary-container"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g. Block B - Ground Floor"
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl focus:ring-1 focus:ring-primary-container"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">Owner Email</Label>
            <Input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              placeholder="owner@lpu.edu"
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl font-mono text-sm focus:ring-1 focus:ring-primary-container"
            />
            <p className="text-[10px] text-on-surface/30">
              Must be a registered user with &quot;kiosk_owner&quot; role
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-highest/30">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Subscribed Plan
              </p>
              <p className="text-[10px] text-on-surface/40">
                Enable polls & feedback access
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubscribed(!subscribed)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                subscribed ? "bg-primary-container" : "bg-neutral-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm absolute top-0.5 transition-all ${
                  subscribed
                    ? "right-0.5 bg-white"
                    : "left-0.5 bg-neutral-400"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl py-2 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-surface-dim font-bold py-3.5 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 20px rgba(255, 140, 0, 0.2)" }}
          >
            {loading ? "Creating…" : "Create Kiosk"}
          </button>
        </form>
      </div>
    </div>
  );
}
