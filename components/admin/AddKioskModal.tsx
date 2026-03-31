"use client";

import { useState, useCallback } from "react";
import { X, UserPlus, Link2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AddKioskModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type Mode = "create" | "link";

function generatePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export function AddKioskModal({ onClose, onCreated }: AddKioskModalProps) {
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create mode state
  const [generatedPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdSuccessfully, setCreatedSuccessfully] = useState(false);

  const supabase = createClient();

  const copyPassword = useCallback(async () => {
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let ownerId: string;

      if (mode === "create") {
        // Call API to create kiosk owner account (no email verification)
        const res = await fetch("/api/admin/create-kiosk-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: ownerEmail,
            password: generatedPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create account");
          setLoading(false);
          return;
        }

        ownerId = data.userId;
      } else {
        // Link mode — look up existing user
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
          setError(
            "This user is not a kiosk owner. Change their role first."
          );
          setLoading(false);
          return;
        }

        ownerId = owner.id;
      }

      // Insert kiosk
      const { data: kiosk, error: insertErr } = await supabase
        .from("kiosks")
        .insert({
          name,
          location,
          owner_id: ownerId,
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
        .eq("id", ownerId);

      if (mode === "create") {
        // Show the password one time before closing
        setCreatedSuccessfully(true);
        setLoading(false);
      } else {
        onCreated();
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  // Success screen — show password one time
  if (createdSuccessfully) {
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
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface">
              Kiosk Created!
            </h2>
            <p className="text-on-surface/50 text-sm">
              Share these credentials with the kiosk owner.
              <br />
              <span className="text-yellow-400 font-semibold">
                The password will not be shown again.
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-highest/40 rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
                Email
              </p>
              <p className="text-on-surface font-mono text-sm">{ownerEmail}</p>
            </div>

            <div className="bg-surface-container-highest/40 rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
                Password
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-on-surface font-mono text-sm">
                  {showPassword
                    ? generatedPassword
                    : "•".repeat(generatedPassword.length)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface/50"
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <button
                    onClick={copyPassword}
                    className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface/50"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onCreated}
            className="w-full bg-primary-container text-surface-dim font-bold py-3.5 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95"
            style={{ boxShadow: "0 0 20px rgba(255, 140, 0, 0.2)" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

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

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-surface-container-highest/30">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === "create"
                ? "bg-primary-container text-surface-dim"
                : "text-on-surface/50 hover:text-on-surface"
            }`}
          >
            <UserPlus size={16} />
            Create New Owner
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === "link"
                ? "bg-primary-container text-surface-dim"
                : "text-on-surface/50 hover:text-on-surface"
            }`}
          >
            <Link2 size={16} />
            Link Existing
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
            <Label className="text-on-surface/70 text-sm">
              {mode === "create" ? "New Owner Email" : "Existing Owner Email"}
            </Label>
            <Input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              placeholder={
                mode === "create"
                  ? "newowner@example.com"
                  : "existing@lpu.edu"
              }
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl font-mono text-sm focus:ring-1 focus:ring-primary-container"
            />
            <p className="text-[10px] text-on-surface/30">
              {mode === "create"
                ? "A new account will be created. No verification email sent."
                : 'Must be a registered user with "kiosk_owner" role'}
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
            {loading
              ? "Creating…"
              : mode === "create"
              ? "Create Owner & Kiosk"
              : "Link & Create Kiosk"}
          </button>
        </form>
      </div>
    </div>
  );
}
