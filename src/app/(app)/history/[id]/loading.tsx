import { Skeleton } from "../../../../components/Skeleton";
import Link from "next/link";

export default function EntryDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top App Bar Skeleton */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/history" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant transition-colors text-on-surface active:scale-95">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>
          <h1 className="font-headline-lg text-headline-md font-bold text-on-surface">Entry Details</h1>
        </div>
      </header>

      <main className="p-6">
        <div className="flex flex-col gap-6 max-w-lg mx-auto">
          {/* Summary Header Skeleton */}
          <div className="bg-primary text-on-primary rounded-3xl p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <Skeleton className="w-16 h-6 rounded-full bg-white/20" />
                <Skeleton className="w-24 h-4 bg-white/20 mt-1" />
              </div>
              <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
            </div>
            
            <div className="flex flex-col gap-1 mt-2">
              <h2 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Net Savings</h2>
              <Skeleton className="w-40 h-12 bg-white/20" />
            </div>
          </div>

          {/* Breakdown Details Skeleton */}
          <div className="bg-surface rounded-3xl border border-outline-variant/30 p-6 shadow-sm flex flex-col gap-5">
            <h3 className="font-headline-md font-bold text-on-surface border-b border-outline-variant/30 pb-3">Breakdown</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Total Income</span>
                <Skeleton className="w-24 h-7" />
              </div>

              <div className="h-px w-full bg-outline-variant/20 my-1"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Daily Expenses</span>
                <Skeleton className="w-20 h-7" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Family Support</span>
                <Skeleton className="w-20 h-7" />
              </div>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-3 mt-4">
            <Skeleton className="flex-1 h-14 rounded-2xl" />
            <Skeleton className="flex-[2] h-14 rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
