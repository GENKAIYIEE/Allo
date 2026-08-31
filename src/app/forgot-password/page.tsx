"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      setStep("otp");
      setSuccessMsg("We sent a recovery code to your email. Please check your inbox.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) throw error;

      setSuccessMsg("Code verified! Redirecting...");
      setTimeout(() => {
        router.push("/update-password");
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid or expired code.");
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
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
              {step === "email" ? "Reset Password" : "Check Your Email"}
            </h1>
            <p className="text-slate-500 mt-2">
              {step === "email" 
                ? "Enter your email to receive a reset code."
                : `We've sent a code to ${email}`}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 animate-fade-in-up-delay-1">
          {step === "email" ? (
            <form onSubmit={handleSendEmail} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 group">
                <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium animate-fade-in-up">
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !email}
                className={`w-full py-3.5 mt-4 text-white font-medium rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-2 ${
                  loading || !email
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(0,17,66,0.15)] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 group">
                <label className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-primary">6-Digit Code</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-center tracking-[0.5em] font-bold text-xl"
                  placeholder="••••••"
                  maxLength={6}
                />
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
                disabled={loading || otp.length !== 6}
                className={`w-full py-3.5 mt-4 text-white font-medium rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-2 ${
                  loading || otp.length !== 6
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(0,17,66,0.15)] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-sm text-slate-500 hover:text-primary transition-colors text-center mt-2 font-medium"
              >
                Change Email Address
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-slate-500 animate-fade-in-up-delay-2">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
