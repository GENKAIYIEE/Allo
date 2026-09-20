import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-8 transition-colors">
          <span className="mr-2 text-xl leading-none">&larr;</span>
          Back to App
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#001A4B] mb-6">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: September 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the Allo application ("Service"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the app or use any services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">2. Description of Service</h2>
            <p>Allo is a personal finance and budgeting application designed to help users track expenses and manage their money ("Where every peso finds its purpose"). The Service is provided "as is" and "as available".</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">3. User Accounts</h2>
            <p>To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">4. User Data and Privacy</h2>
            <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using Allo, you consent to our data practices as outlined in the Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">5. Modifications to Service</h2>
            <p>Allo reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">6. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact support.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
