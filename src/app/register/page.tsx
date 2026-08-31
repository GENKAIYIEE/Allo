"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        throw error;
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign up. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 py-12 font-sans">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-4 animate-fade-in-up">
          <div className="bg-primary p-3 rounded-2xl shadow-sm mb-1 transition-transform duration-500 hover:scale-105 hover:shadow-md cursor-default">
            <Image 
              src="/payflow_logo_final.png"
              alt="Allo Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Create an account</h1>
            <p className="text-slate-500 mt-2">Sign up to start tracking your salary.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 animate-fade-in-up-delay-1">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
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
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
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
              <div className="p-4 mt-2 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium animate-fade-in-up">
                {errorMsg}
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
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-slate-500 animate-fade-in-up-delay-2">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
