"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import Image from "next/image";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth events. When the user clicks the reset link, 
    // Supabase will parse the URL hash and trigger SIGNED_IN or PASSWORD_RECOVERY.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setErrorMsg(null);
      }
    });

    // Fallback check: wait 1.5 seconds for Supabase to parse the hash
    const timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Invalid or expired reset link. Please click the link in your email again.");
      }
    }, 1500);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase.auth]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-4 animate-fade-in-up">
          <div className="bg-primary p-3 rounded-2xl shadow-sm mb-2 transition-transform duration-500 hover:scale-105 hover:shadow-md cursor-default">
            <Image 
              src="/allo_logo_v4.png"
              alt="Allo Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Set New Password</h1>
            <p className="text-slate-500 mt-2">Enter your new password below.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 animate-fade-in-up-delay-1">
          <form onSubmit={handleUpdate} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 rounded-full flex items-center justify-center transition-colors duration-300"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 rounded-full flex items-center justify-center transition-colors duration-300"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium animate-fade-in-up">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-medium animate-fade-in-up">
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3.5 mt-4 text-white font-medium rounded-xl transition-all duration-300 ease-out ${
                loading 
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(0,17,66,0.15)] active:scale-[0.98]'
              }`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
