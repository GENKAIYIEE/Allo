"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setSuccessMsg("Registration successful! Please log in.");
        // Optional: remove query param from URL cleanly
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      let errorMessage = err instanceof Error ? err.message : "Failed to log in. Please check your credentials.";
      
      // Use generic Supabase error
      if (errorMessage === "Invalid login credentials") {
        errorMessage = "Invalid login credentials. Please try again.";
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* Background Shapes (SVG for perfect responsiveness) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice" className="absolute top-0 left-0 w-full h-full">
          <defs>
            <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C469B" />
              <stop offset="100%" stopColor="#3A7DF1" />
            </linearGradient>
            <linearGradient id="gradBot" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1C469B" />
              <stop offset="100%" stopColor="#3A7DF1" />
            </linearGradient>
          </defs>

          {/* Top Left */}
          <polygon points="0,0 1000,0 0,800" fill="#D4E5FA" opacity="0.6" />
          <polygon points="0,0 750,0 0,600" fill="url(#gradTop)" opacity="0.9" />
          <polygon points="0,0 500,0 0,400" fill="#001A4B" />

          {/* Bottom Right */}
          <polygon points="1440,1024 565,1024 1440,324" fill="url(#gradBot)" opacity="0.9" />
          <polygon points="1440,1024 940,1024 1440,624" fill="#001A4B" />
        </svg>
      </div>

      <div className="w-full max-w-md flex flex-col gap-10 z-10">
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
            <h1 className="text-3xl font-semibold text-[#001A4B] tracking-tight drop-shadow-sm">Welcome back</h1>
            <p className="text-slate-600 mt-2 font-medium">Please enter your details to sign in.</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 animate-fade-in-up-delay-1">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 group">
              <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
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

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-medium animate-fade-in-up">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium animate-fade-in-up">
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="text-center text-sm text-slate-500 animate-fade-in-up-delay-2">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign up
              </Link>
            </div>

            <div className="text-center text-xs text-slate-400 animate-fade-in-up-delay-2">
              By continuing, you agree to our <Link href="/terms" className="underline hover:text-slate-600 transition-colors">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-slate-600 transition-colors">Privacy Policy</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
