"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function StudentLoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      className="text-on-surface min-h-[100dvh] flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top right, #1a1a2e 0%, #131313 100%)",
      }}
    >
      {/* Decorative blur orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary-container/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="flex items-center justify-center px-6 py-10 w-full relative">
        <Link
          href="/"
          className="absolute left-6 top-10 text-on-surface/60 hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Utensils size={28} className="text-primary-container" />
          <span className="font-bold tracking-tighter text-2xl text-on-surface">
            CampusBite
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-8 max-w-md">
        {/* Hero Text */}
        <div className="w-full text-center space-y-4 mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
            Welcome, Student
          </h1>
          <p className="text-on-surface/50 text-lg">
            Login to start discovering food
          </p>
        </div>

        {/* Login Actions */}
        <div className="w-full space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white text-black font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary-container/5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span>{loading ? "Redirecting…" : "Continue with Google"}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 pb-12 text-center space-y-6">
        <p className="text-xs text-on-surface/30 tracking-wide leading-relaxed max-w-[240px] mx-auto">
          By continuing you agree to our{" "}
          <a
            className="text-on-surface/50 hover:text-primary transition-colors underline underline-offset-4"
            href="#"
          >
            Terms of Use
          </a>{" "}
          &amp;{" "}
          <a
            className="text-on-surface/50 hover:text-primary transition-colors underline underline-offset-4"
            href="#"
          >
            Privacy Policy
          </a>
        </p>
        <div className="pt-4 opacity-50">
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
            © 2024 CampusBite. Discover. Swipe. Eat.
          </p>
        </div>
      </footer>
    </div>
  );
}
