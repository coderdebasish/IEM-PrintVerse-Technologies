"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-8 shadow-2xl"
    >
      <h1 className="text-xl font-black text-[#0B1F4D] mb-6">Sign In</h1>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-email" className="text-sm font-semibold text-[#0B1F4D]">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@printverse.in"
            className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0B1F4D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/40 focus:border-[#C41E2C] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-password" className="text-sm font-semibold text-[#0B1F4D]">
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#e2e8f0] text-[#0B1F4D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/40 focus:border-[#C41E2C] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F4D] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        id="admin-login-btn"
        disabled={loading}
        className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B1F4D] text-white font-bold text-sm hover:bg-[#1a3a7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
