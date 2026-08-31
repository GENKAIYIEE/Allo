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

  // Fetch true lifetime totals quickly (without fetching all full rows)
  // We'll fetch just income and ipon_goal for all logs to aggregate them
  const { data: allLogsForTotals, error: totalsError } = await supabase
    .from("payday_logs")
    .select("income, ipon_goal");

  if (totalsError) {
    console.error("Error fetching totals:", totalsError);
  }

  let lifetimeIncome = 0;
  let lifetimeSavings = 0;
  
  allLogsForTotals?.forEach(log => {
    lifetimeIncome += Number(log.income) || 0;
    lifetimeSavings += Number(log.ipon_goal) || 0;
  });

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
        <div className="flex items-center justify-between px-container-padding h-16 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors flex items-center">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-container-padding pt-section-margin">
        {/* Lifetime Totals */}
        <section className="mb-section-margin bg-primary text-on-primary p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-outline-variant animate-fade-in-up-delay-1">
          <div>
            <h2 className="font-label-caps text-label-caps uppercase opacity-80">Lifetime Income</h2>
            <div className="font-display-currency-mobile text-display-currency-mobile">
              ₱{lifetimeIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps uppercase opacity-80">Lifetime Savings</h2>
            <div className="font-display-currency-mobile text-display-currency-mobile text-secondary-fixed">
              ₱{lifetimeSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </section>

        <HistoryList initialLogs={logs} />
      </main>
    </div>
  );
}
