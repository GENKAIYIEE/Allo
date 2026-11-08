"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth events. When the user clicks the reset link,
    // Supabase will parse the URL hash and trigger SIGNED_IN or PASSWORD_RECOVERY.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasValidSession(true);
        setErrorMsg(null);
      }
    });

    // Fallback check: wait 1.5 seconds for Supabase to parse the hash
    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasValidSession(false);
        setErrorMsg("Invalid or expired reset link. Please request a new password reset code.");
      } else {
        setHasValidSession(true);
      }
    }, 1500);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase.auth]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/settings");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!hasValidSession) {
      setErrorMsg("Your session has expired. Please request a new password reset code.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasValidSession(false);
        throw new Error("Your session has expired. Please request a new password reset code.");
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccessMsg("Password updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans md:max-w-md md:mx-auto md:border-x border-slate-200 flex flex-col pb-16">
      {/* Sticky Top App Bar with Back Button */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-sm font-bold text-slate-800">Security</h1>
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Title Header */}
      <div className="px-6 pt-6 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account Security</span>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Set New Password</h2>
        <p className="text-xs text-slate-500 mt-1">Please enter your new password below to secure your account.</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleUpdate} className="px-6 py-4 flex flex-col gap-4">
        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!hasValidSession || loading}
              autoComplete="new-password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-3 text-sm text-slate-900 focus:bg-white focus:border-[#001142] focus:ring-1 focus:ring-[#001142] focus:outline-none transition-colors duration-150 disabled:opacity-60"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full flex items-center justify-center transition-colors duration-150"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400">Must be at least 6 characters long</span>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!hasValidSession || loading}
              autoComplete="new-password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-3 text-sm text-slate-900 focus:bg-white focus:border-[#001142] focus:ring-1 focus:ring-[#001142] focus:outline-none transition-colors duration-150 disabled:opacity-60"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full flex items-center justify-center transition-colors duration-150"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showConfirmPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={loading || !hasValidSession}
          className="w-full py-3.5 mt-2 bg-[#001142] hover:bg-[#00195e] text-white font-bold rounded-xl text-sm transition-colors duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
        >
          {loading && (
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          )}
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
