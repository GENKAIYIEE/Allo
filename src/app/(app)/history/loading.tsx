import { Skeleton } from "../../../components/Skeleton";

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      <header className="w-full top-0 sticky bg-surface border-b border-outline-variant z-40">
        <div className="flex items-center justify-between px-container-padding h-16 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 flex items-center">
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            <Skeleton className="w-24 h-8" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-container-padding pt-section-margin">
        {/* Lifetime Totals Skeleton */}
        <section className="mb-section-margin bg-primary text-on-primary p-6 rounded-xl flex flex-col gap-4 shadow-sm border border-outline-variant">
          <div>
            <h2 className="font-label-caps text-label-caps uppercase opacity-80">Lifetime Income</h2>
            <Skeleton className="w-48 h-10 mt-1 bg-white/20" />
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps uppercase opacity-80">Lifetime Savings</h2>
            <Skeleton className="w-48 h-10 mt-1 bg-secondary-fixed/30" />
          </div>
        </section>

        {/* Grouped Logs Skeleton */}
        <div className="flex flex-col gap-section-margin">
          <section className="flex flex-col gap-element-gap">
            <div className="flex items-end justify-between border-b border-outline-variant pb-2">
              <Skeleton className="w-32 h-8" />
            </div>
            
            {/* Month Summary Skeleton */}
            <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 mb-3 shadow-sm">
              <div className="flex flex-col flex-1 gap-1">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Income</span>
                <Skeleton className="w-16 h-5" />
              </div>
              <div className="flex flex-col flex-1 gap-1 pl-2 border-l border-outline-variant/60">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Expenses</span>
                <Skeleton className="w-16 h-5" />
              </div>
              <div className="flex flex-col flex-1 gap-1 pl-2 border-l border-outline-variant/60">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Savings</span>
                <Skeleton className="w-16 h-5" />
              </div>
            </div>

            {/* Logs List Skeleton */}
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-col items-start gap-2 mt-1">
                      <Skeleton className="w-10 h-4 rounded" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                    <div className="flex flex-col items-end gap-1 pl-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-80">Savings</span>
                      <Skeleton className="w-20 h-6" />
                    </div>
                  </div>
                  
                  <div className="bg-surface-container/30 rounded-lg p-3">
                    <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Income</span>
                      <Skeleton className="w-16 h-6" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 px-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Daily Expenses</span>
                        <Skeleton className="w-14 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Family Support</span>
                        <Skeleton className="w-14 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
