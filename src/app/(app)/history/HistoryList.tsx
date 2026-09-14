"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

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
  is_pending_sync?: boolean;
}

interface HistoryListProps {
  initialLogs: PaydayLog[];
}

export default function HistoryList({ initialLogs }: HistoryListProps) {
  const [logs, setLogs] = useState<PaydayLog[]>(initialLogs);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialLogs.length >= 10);
  const supabase = createClient();
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchMoreLogs = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const lastLog = logs[logs.length - 1];
      const { data: newLogs, error } = await supabase
        .from("payday_logs")
        .select("*")
        .lt("created_at", lastLog.created_at)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching more logs:", error);
        return;
      }

      if (newLogs && newLogs.length > 0) {
        setLogs(prev => [...prev, ...newLogs]);
        if (newLogs.length < 10) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [logs, loadingMore, hasMore, supabase]);

  useEffect(() => {
    // Merge offline pending logs on initial load
    try {
      const queueRaw = localStorage.getItem("offline_sync_queue");
      if (queueRaw) {
        const queue = JSON.parse(queueRaw);
        if (Array.isArray(queue) && queue.length > 0) {
          setLogs(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newOffline = queue.filter(q => !existingIds.has(q.id));
            // Sort new offline logs so newest is at the top
            newOffline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return [...newOffline, ...prev];
          });
        }
      }
    } catch (e) {
      console.error("Failed to load offline queue:", e);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchMoreLogs();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, fetchMoreLogs, hasMore, loadingMore]);

  // Group the current loaded logs
  const groupedLogs: Record<string, {
    logs: PaydayLog[];
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
  }> = {};

  logs.forEach((log: PaydayLog) => {
    const monthYear = formatInTimeZone(new Date(log.created_at), 'Asia/Manila', 'MMMM yyyy');

    if (!groupedLogs[monthYear]) {
      groupedLogs[monthYear] = {
        logs: [],
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0
      };
    }

    groupedLogs[monthYear].logs.push(log);
    groupedLogs[monthYear].totalIncome += Number(log.income) || 0;
    
    const totalCustom = log.custom_allocations ? Object.values(log.custom_allocations).reduce((sum, val) => sum + Number(val), 0) : 0;
    const oldExpenses = (Number(log.daily_expenses) || 0) + (Number(log.family_support) || 0);
    groupedLogs[monthYear].totalExpenses += log.custom_allocations ? totalCustom : oldExpenses;
    
    groupedLogs[monthYear].totalSavings += Number(log.ipon_goal) || 0;
  });

  return (
    <div className="flex flex-col gap-section-margin animate-fade-in-up-delay-2">
      {Object.entries(groupedLogs).map(([monthYear, data]) => (
        <section key={monthYear} className="flex flex-col gap-element-gap">
          <div className="flex items-end justify-between border-b border-outline-variant pb-2">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">{monthYear}</h3>
          </div>
          
          {/* Month Summary */}
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 mb-3 shadow-sm">
            <div className="flex flex-col flex-1 min-w-0 pr-2">
              <span className="font-label-caps text-[10px] uppercase text-on-surface-variant truncate">Income</span>
              <span className="font-display-currency font-semibold text-primary text-sm truncate" title={`₱${data.totalIncome.toLocaleString()}`}>
                ₱{data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 px-2 border-l border-outline-variant/60">
              <span className="font-label-caps text-[10px] uppercase text-on-surface-variant truncate">Expenses</span>
              <span className="font-display-currency font-semibold text-error text-sm truncate" title={`₱${data.totalExpenses.toLocaleString()}`}>
                ₱{data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pl-2 border-l border-outline-variant/60">
              <span className="font-label-caps text-[10px] uppercase text-on-surface-variant truncate">Savings</span>
              <span className="font-display-currency font-semibold text-secondary text-sm truncate" title={`₱${data.totalSavings.toLocaleString()}`}>
                ₱{data.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex flex-col gap-3">
            {data.logs.map(log => {
              const formattedDate = formatInTimeZone(new Date(log.created_at), 'Asia/Manila', 'MMM d');
              const formattedTime = formatInTimeZone(new Date(log.created_at), 'Asia/Manila', 'h:mm a');
              
              return (
                <Link href={`/history/${log.id}`} key={log.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3 transition-all active:scale-[0.98] hover:shadow-md block relative overflow-hidden group">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                  </div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-col items-start gap-1 mt-1 shrink min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary text-on-primary rounded text-[10px] font-bold tracking-wider whitespace-nowrap">{log.cutoff_type}</span>
                        {log.is_pending_sync && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold tracking-wider whitespace-nowrap border border-amber-200 animate-pulse flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">cloud_off</span> Pending Sync
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-on-surface-variant/80 tracking-wider whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        {formattedDate} <span className="opacity-50 mx-1">&bull;</span> {formattedTime}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-80">Savings</span>
                      <div className="font-display-currency font-bold text-secondary text-lg whitespace-nowrap">
                        +₱{Number(log.ipon_goal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container/30 rounded-lg p-3">
                    <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Income</span>
                      <span className="font-bold text-primary font-display-currency text-lg">₱{Number(log.income).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 px-1">
                      {log.custom_allocations ? (
                        Object.entries(log.custom_allocations).map(([name, amount]) => (
                          <div key={name} className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">{name}</span>
                            <span className="font-semibold text-error font-display-currency">₱{Number(amount).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">Daily Expenses</span>
                            <span className="font-semibold text-error font-display-currency">₱{Number(log.daily_expenses).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">Family Support</span>
                            <span className="font-semibold text-error font-display-currency">₱{Number(log.family_support).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* Loading Trigger / Spinner */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary opacity-50">sync</span>
        </div>
      )}
      
      {!hasMore && logs.length > 0 && (
        <div className="text-center py-6">
          <p className="text-on-surface-variant font-body-sm opacity-60">You have reached the end of your history.</p>
        </div>
      )}
    </div>
  );
}
