import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-8 transition-colors">
          <span className="mr-2 text-xl leading-none">&larr;</span>
          Back to App
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#001A4B] mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: September 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">1. Information We Collect</h2>
            <p>When you use Allo, we may collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Personal Information:</strong> such as your name, email address, and authentication details when you create an account.</li>
              <li><strong>Financial Data:</strong> transaction history, budgets, and categorization data that you actively input into the app.</li>
              <li><strong>Usage Data:</strong> automated information about how you interact with the app, device information, and crash reports to help us improve stability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information for various purposes, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>To provide and maintain our Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>To allow you to participate in interactive features of our Service.</li>
              <li>To provide customer support and improve the app's functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">3. Data Security</h2>
            <p>The security of your data is critical to us. We implement industry-standard security measures (including Supabase database encryption and secure authentication flows) to protect your personal information. However, remember that no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">4. Disclosure of Data</h2>
            <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners for the purposes outlined above.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#001A4B] mb-3">5. Changes to This Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
