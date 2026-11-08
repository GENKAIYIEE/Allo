"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans md:max-w-md md:mx-auto md:border-x border-slate-200 pb-16">
      {/* Sticky Top App Bar */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-sm font-bold text-slate-800">Account & Data Deletion</h1>
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Title Header */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Allo Data Safety</p>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Delete Your Allo Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Instructions for permanently removing your Allo account and associated financial records.
        </p>
      </div>

      <div className="px-5 divide-y divide-slate-100">
        {/* How to Delete In-App */}
        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">1. How to Delete Your Account</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            You can permanently delete your Allo account directly from the app or web portal at any time:
          </p>
          <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
            <li>Sign in to your account in the Allo app or web portal.</li>
            <li>Go to <strong className="text-slate-800 font-semibold">Profile</strong> (Settings) from the bottom navigation bar.</li>
            <li>Tap <strong className="text-slate-800 font-semibold">Personal information</strong>.</li>
            <li>Tap <strong className="text-rose-600 font-semibold">Delete account</strong>, type <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">DELETE</code> to confirm, and submit.</li>
          </ol>

          <div className="mt-4 flex flex-col gap-2.5">
            <Link
              href="/settings"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition-colors duration-150"
            >
              Open Profile Settings to Delete Account
            </Link>
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center transition-colors duration-150"
            >
              Sign In to Your Account
            </Link>
          </div>
        </section>

        {/* Data Deleted vs Retained */}
        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">2. What Data Is Deleted</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
            When you confirm account deletion, the following records are permanently and immediately deleted:
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>Your account profile, full name, email address, and authentication credentials.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>All logged salary entries, cutoff histories, and savings/allocation breakdowns.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>All locally cached budget formulas, career profiles, and offline sync queues on your device.</span>
            </li>
          </ul>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">3. Retention Period</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Account and financial record deletion takes effect immediately upon confirmation and cannot be undone. No personal or financial data is retained after deletion.
          </p>
        </section>
      </div>
    </div>
  );
}

