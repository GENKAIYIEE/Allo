"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { validateEmailFormatAndDomain } from "../../lib/emailValidation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuggestedEmail(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters).");
      return;
    }

    const emailCheck = validateEmailFormatAndDomain(trimmedEmail);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || "Please enter a valid email address.");
      if (emailCheck.suggestedEmail) {
        setSuggestedEmail(emailCheck.suggestedEmail);
      }
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
      // Server-side email & DNS MX record validation
      const verifyResponse = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailCheck.normalizedEmail }),
      });

      const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
        valid?: boolean;
        error?: string;
        suggestedEmail?: string;
      };

      if (!verifyResponse.ok || !verifyData.valid) {
        if (verifyData.suggestedEmail) {
          setSuggestedEmail(verifyData.suggestedEmail);
        }
        throw new Error(verifyData.error || "Please enter a valid email address.");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailCheck.normalizedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Detect duplicate registration when email confirmation is enabled
      if (data?.user?.identities && data.user.identities.length === 0) {
        throw new Error("An account with this email address already exists. Please sign in instead.");
      }

      // Ensure user explicitly signs in on /login rather than auto-redirecting past /login?registered=true
      if (data?.session) {
        await supabase.auth.signOut();
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
    <div className="relative h-dvh bg-[#F4F7FB] flex flex-col items-center justify-center px-5 py-4 font-sans overflow-hidden">
      
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

      <div className="w-full max-w-md flex flex-col gap-4 z-10">
        <div className="flex flex-col items-center text-center gap-2 animate-fade-in-up">
          <div className="bg-primary p-2.5 rounded-2xl shadow-sm transition-transform duration-500 hover:scale-105 hover:shadow-md cursor-default">
            <Image 
              src="/allo_logo_v4.png"
              alt="Allo Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#001A4B] tracking-tight drop-shadow-sm">Create an account</h1>
            <p className="text-slate-600 text-sm mt-0.5 font-medium">Sign up to start tracking your salary.</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 animate-fade-in-up-delay-1">
          <form onSubmit={handleRegister} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-medium text-slate-700 transition-colors group-focus-within:text-primary">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-medium text-slate-700 transition-colors group-focus-within:text-primary">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (suggestedEmail) setSuggestedEmail(null);
                }}
                autoComplete="email"
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-medium text-slate-700 transition-colors group-focus-within:text-primary">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
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

            <div className="flex flex-col gap-1.5 group">
              <label className="text-xs font-medium text-slate-700 transition-colors group-focus-within:text-primary">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder-slate-400"
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
              <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-medium animate-fade-in-up flex flex-col gap-1.5">
                <span>{errorMsg}</span>
                {suggestedEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(suggestedEmail);
                      setErrorMsg(null);
                      setSuggestedEmail(null);
                    }}
                    className="self-start text-xs font-semibold text-primary bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-150"
                  >
                    Use {suggestedEmail}
                  </button>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 mt-1 text-sm text-white font-medium rounded-xl transition-all duration-300 ease-out ${
                loading 
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(0,17,66,0.15)] active:scale-[0.98]'
              }`}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500 animate-fade-in-up-delay-2">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
