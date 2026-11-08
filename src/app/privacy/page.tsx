"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
        <h1 className="text-sm font-bold text-slate-800">Privacy Policy</h1>
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Title Header */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Legal Document</p>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Privacy Policy</h2>
        <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
      </div>

      {/* Policy Content */}
      <div className="px-5 divide-y divide-slate-100">
        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">1. Information We Collect</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            When you use Allo, we may collect the following types of information:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-800 font-semibold">Personal Information:</strong> such as your name, email address, and authentication details when you create an account.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-800 font-semibold">Financial Data:</strong> transaction history, budgets, and categorization data that you actively input into the app.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-800 font-semibold">Usage Data:</strong> automated information about how you interact with the app, device information, and crash reports to help us improve stability.
              </span>
            </li>
          </ul>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">2. How We Use Your Information</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            We use the collected information for various purposes, including:
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>To provide and maintain our Service.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>To notify you about changes to our Service.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>To allow you to participate in interactive features of our Service.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>To provide customer support and improve the app&apos;s functionality.</span>
            </li>
          </ul>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">3. Data Security</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The security of your data is critical to us. We implement industry-standard security measures and modern encryption protocols to ensure your personal information remains confidential, safe, and protected.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">4. Disclosure of Data</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners for the purposes outlined above.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">5. Data Retention &amp; Account Deletion</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
            We retain your personal and financial data only for as long as your account remains active. You may permanently delete your account and all associated financial logs at any time inside the app under <strong className="text-slate-800 font-semibold">Profile &rarr; Personal information &rarr; Delete account</strong>, or by visiting our{" "}
            <Link href="/delete-account" className="text-primary font-semibold underline hover:text-primary/80">
              Account Deletion page
            </Link>
            .
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">6. Changes to This Policy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
          </p>
        </section>

        <section className="py-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">7. Contact Us</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If you have any questions about this Privacy Policy, your data rights, or account deletion requests, please contact the Allo support team via the contact email listed on our Google Play Store listing.
          </p>
        </section>
      </div>
    </div>
  );
}
