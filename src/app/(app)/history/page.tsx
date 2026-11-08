import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PaydayLog {
  id: string;
  created_at: string;
  cutoff_type: string;
  income: number;
  daily_expenses: number;
  family_support: number;
  ipon_goal: number;
  custom_allocations?: Record<string, number>;
  company_name?: string;
  income_source?: string;
  user_id: string;
}

import HistoryList from "./HistoryList";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-on-background">
        <span className="material-symbols-outlined text-6xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary mb-4">Not Signed In</h1>
        <p className="text-on-surface-variant font-body-lg mb-8">You need to sign in to view your history.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:bg-primary-container transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Fetch all logs needed for totals (including company and role for filtering)
  const { data: allLogsForTotals, error: totalsError } = await supabase
    .from("payday_logs")
    .select("income, ipon_goal, company_name, income_source");

  if (totalsError) {
    console.error("Error fetching totals:", totalsError);
  }

  // Fetch only the first 10 logs for the initial render
  const { data: logs, error } = await supabase
    .from("payday_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching logs:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-on-background">
        <h1 className="font-headline-lg text-headline-lg font-bold text-error mb-4">Something went wrong</h1>
        <p className="text-on-surface-variant font-body-lg mb-8">We couldn&apos;t load your history. Please try again later.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:bg-primary-container transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-on-background">
        <span className="material-symbols-outlined text-6xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>history</span>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary mb-4">No History Yet</h1>
        <p className="text-on-surface-variant font-body-lg mb-8">You haven&apos;t saved any payday logs. Start allocating your budget on the dashboard!</p>
        <Link href="/dashboard" className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:bg-primary-container transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      <header className="w-full top-0 sticky bg-surface border-b border-outline-variant z-40 animate-fade-in-up">
        <div className="flex items-center justify-between px-container-padding h-16">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">History</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-container-padding pt-section-margin">
        <HistoryList initialLogs={logs} allLogsForTotals={allLogsForTotals || []} />
      </main>
    </div>
  );
}
