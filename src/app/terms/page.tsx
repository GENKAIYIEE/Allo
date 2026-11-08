"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/settings");
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
        <h1 className="text-sm font-bold text-slate-800">Terms of Service</h1>
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Title Header */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Legal Document</p>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Terms of Service</h2>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      {/* Terms Content */}
      <div className="px-5 divide-y divide-slate-100">
        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            By accessing or using the Allo application (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the app or use any services.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">2. Description of Service</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Allo is a personal finance and budgeting application designed to help users track expenses and manage their money (&quot;Where every peso finds its purpose&quot;). The Service is provided &quot;as is&quot; and &quot;as available&quot;.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">3. User Accounts</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">4. User Data and Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using Allo, you consent to our data practices as outlined in the Privacy Policy.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">5. Modifications to Service</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Allo reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Service.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">6. Contact Us</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If you have any questions about these Terms, please contact support.
          </p>
        </section>
      </div>
    </div>
  );
}
