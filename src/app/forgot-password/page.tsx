"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Frontend only for now - simulate API call
    setTimeout(() => {
      alert("Password reset link sent to " + email);
      setLoading(false);
      router.push("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2 animate-fade-in-up">
          <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Reset Password</h1>
          <p className="text-on-surface-variant font-body-sm">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-4 animate-fade-in-up-delay-1">
          <div className="flex flex-col gap-1 group">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase transition-colors group-focus-within:text-primary">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-on-surface placeholder-outline"
              placeholder="you@example.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !email}
            className={`w-full py-4 mt-4 font-headline-md text-headline-md rounded-full transition-colors active:scale-[0.98] ${
              loading || !email
                ? 'bg-surface-variant text-outline cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
            }`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center font-body-sm text-on-surface-variant">
          <Link href="/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
