"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success, middleware handles redirect to /admin/kiosks
  };

  return (
    <div className="bg-mesh text-on-surface min-h-[100dvh] flex flex-col items-center justify-center relative px-6">
      {/* Decorative blur orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary-container/8 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-sm glass-card border-glow rounded-3xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Admin Access
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-on-surface/70 text-sm">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@campusbite.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-surface-bright/20 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl focus:ring-1 focus:ring-primary-container"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="admin-password"
              className="text-on-surface/70 text-sm"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-surface-bright/20 border-0 text-on-surface placeholder:text-on-surface/30 h-12 rounded-xl pr-12 focus:ring-1 focus:ring-primary-container"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl py-2 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-surface-dim font-bold py-3.5 rounded-full transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed lume-glow"
          >
            {loading ? "Authenticating…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
