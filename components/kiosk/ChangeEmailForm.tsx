"use client";

import { useState } from "react";
import { Mail, Send, ShieldCheck, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface ChangeEmailFormProps {
  currentEmail: string;
  userId: string;
}

type Step = "idle" | "otp_sent" | "success";

export function ChangeEmailForm({ currentEmail, userId }: ChangeEmailFormProps) {
  const [step, setStep] = useState<Step>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newEmail === currentEmail) {
      setError("New email is the same as your current email.");
      return;
    }

    setLoading(true);

    // Supabase sends a verification email to the NEW address
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setStep("otp_sent");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: otpCode,
      type: "email_change",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // Update the profiles table to match
    await supabase
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", userId);

    setStep("success");
    setLoading(false);
  };

  const handleReset = () => {
    setStep("idle");
    setNewEmail("");
    setOtpCode("");
    setError("");
  };

  // Success state
  if (step === "success") {
    return (
      <div className="rounded-3xl p-8 space-y-4 text-center bg-surface-container">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <Check size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-on-surface">Email Updated!</h3>
        <p className="text-on-surface/50 text-sm">
          Your email has been changed to{" "}
          <span className="text-on-surface font-mono font-semibold">
            {newEmail}
          </span>
          . Use this email for your next login.
        </p>
        <button
          onClick={handleReset}
          className="text-blue-400 text-sm font-bold hover:underline"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 space-y-6 bg-surface-container">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Mail size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-on-surface">Change Email</h3>
          <p className="text-xs text-on-surface/40">
            A verification code will be sent to your new email
          </p>
        </div>
      </div>

      {/* Current email display */}
      <div className="bg-surface-container-highest/30 rounded-xl p-4 space-y-1">
        <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">
          Current Email
        </p>
        <p className="text-on-surface font-mono text-sm">{currentEmail}</p>
      </div>

      {step === "idle" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">New Email</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="your-new-email@example.com"
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl font-mono text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl py-2 px-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newEmail}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Send Verification Code
              </>
            )}
          </button>
        </form>
      )}

      {step === "otp_sent" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm bg-blue-400/10 rounded-xl py-3 px-4">
            <ShieldCheck size={16} />
            <span>
              Verification code sent to{" "}
              <strong className="font-mono">{newEmail}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-on-surface/70 text-sm">
              Enter 6-digit Code
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              placeholder="000000"
              maxLength={6}
              className="bg-surface-container-highest/50 border-0 text-on-surface placeholder:text-on-surface/30 h-14 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl py-2 px-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-surface-container-highest/40 text-on-surface/60 font-bold py-3 rounded-full transition-all hover:bg-surface-container-highest/60 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify & Change
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            className="w-full text-blue-400 text-xs font-bold hover:underline"
          >
            Didn&apos;t receive it? Resend code
          </button>
        </form>
      )}
    </div>
  );
}
