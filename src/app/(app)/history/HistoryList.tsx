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
  company_name?: string;
  income_source?: string;
  user_id: string;
  is_pending_sync?: boolean;
}

interface CareerProfile {
  id: string;
  company: string;
  role: string;
}

interface HistoryListProps {
  initialLogs: PaydayLog[];
  allLogsForTotals: Partial<PaydayLog>[];
}

export default function HistoryList({ initialLogs, allLogsForTotals }: HistoryListProps) {
  const [logs, setLogs] = useState<PaydayLog[]>(initialLogs);
  const [profiles, setProfiles] = useState<CareerProfile[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ALL");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialLogs.length >= 10);
  const supabase = createClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    // Load profiles
    const savedProfilesLocal = localStorage.getItem("saved_career_profiles_v1");
    let loadedProfiles: CareerProfile[] = [];
    if (savedProfilesLocal) {
      loadedProfiles = JSON.parse(savedProfilesLocal);
      setProfiles(loadedProfiles);
    }

    // Load active workspace
    const activeProfileRaw = localStorage.getItem("active_career_profile_v1");
    if (activeProfileRaw) {
      const p = JSON.parse(activeProfileRaw);
      setActiveWorkspaceId(p.id);
      fetchInitialFilteredLogs(p.id, loadedProfiles);
    } else {
      initialFetchDone.current = true;
    }

    // Merge offline pending logs on initial load
    try {
      const queueRaw = localStorage.getItem("offline_sync_queue");
      if (queueRaw) {
        const queue = JSON.parse(queueRaw);
        if (Array.isArray(queue) && queue.length > 0) {
          setLogs(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newOffline = queue.filter(q => !existingIds.has(q.id));
            newOffline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return [...newOffline, ...prev];
          });
        }
      }
    } catch (e) {
      console.error("Failed to load offline queue:", e);
    }
  }, []);

  const fetchInitialFilteredLogs = async (workspaceId: string, availableProfiles: CareerProfile[]) => {
    if (workspaceId === "ALL") {
      setLogs(initialLogs);
      setHasMore(initialLogs.length >= 10);
      initialFetchDone.current = true;
      return;
    }

    const p = availableProfiles.find(x => x.id === workspaceId);
    if (!p) {
      initialFetchDone.current = true;
      return;
    }

    setLoadingMore(true);
    const { data, error } = await supabase
      .from("payday_logs")
      .select("*")
      .eq("company_name", p.company)
      .eq("income_source", p.role)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setLogs(data);
      setHasMore(data.length >= 10);
    }
    setLoadingMore(false);
    initialFetchDone.current = true;
  };

  const fetchMoreLogs = useCallback(async () => {
    if (loadingMore || !hasMore || !initialFetchDone.current) return;
    
    setLoadingMore(true);
    try {
      const lastLog = logs[logs.length - 1];
      let query = supabase
        .from("payday_logs")
        .select("*")
        .lt("created_at", lastLog?.created_at || new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (activeWorkspaceId !== "ALL") {
        const p = profiles.find(x => x.id === activeWorkspaceId);
        if (p) {
          query = query.eq("company_name", p.company).eq("income_source", p.role);
        }
      }

      const { data: newLogs, error } = await query;

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
  }, [logs, loadingMore, hasMore, supabase, activeWorkspaceId, profiles]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && logs.length > 0 && initialFetchDone.current) {
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
  }, [observerTarget, fetchMoreLogs, hasMore, loadingMore, logs.length]);

  const handleWorkspaceChange = (id: string) => {
    setActiveWorkspaceId(id);
    setLogs([]); // Clear immediately while loading
    fetchInitialFilteredLogs(id, profiles);
  };

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

  // Calculate Lifetime Totals based on filter
  let lifetimeIncome = 0;
  let lifetimeSavings = 0;
  const activeProfile = activeWorkspaceId !== "ALL" ? profiles.find(p => p.id === activeWorkspaceId) : null;
  
  allLogsForTotals.forEach(log => {
    if (activeProfile) {
      if (log.company_name !== activeProfile.company || log.income_source !== activeProfile.role) {
        return; // skip
      }
    }
    lifetimeIncome += Number(log.income) || 0;
    lifetimeSavings += Number(log.ipon_goal) || 0;
  });

  return (
    <div className="flex flex-col gap-section-margin animate-fade-in-up-delay-2">
      
      {/* Workspace Filters */}
      <div className="flex overflow-x-auto pb-2 -mx-container-padding px-container-padding hide-scrollbar gap-2 mb-2 pt-2">
        <button
          onClick={() => handleWorkspaceChange("ALL")}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
            activeWorkspaceId === "ALL" 
              ? "bg-[#001142] text-white border-[#001142] shadow-sm" 
              : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-variant/50"
          }`}
        >
          All Workspaces
        </button>
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => handleWorkspaceChange(profile.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeWorkspaceId === profile.id 
                ? "bg-[#001142] text-white border-[#001142] shadow-sm" 
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">domain</span>
            {profile.company}
          </button>
        ))}
      </div>

      {/* Lifetime Totals */}
      <section className="bg-[#001142] text-white p-6 rounded-xl flex flex-col gap-4 shadow-md border border-[#001142]/20 relative overflow-hidden mt-1 animate-fade-in-up">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
             {activeWorkspaceId === "ALL" ? "account_balance" : "work"}
           </span>
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="font-label-caps text-[10px] uppercase text-blue-200 tracking-widest mb-1">
            {activeWorkspaceId === "ALL" ? "Overall Lifetime Income" : "Workspace Lifetime Income"}
          </h2>
          <div className="font-display-currency text-3xl font-bold">
            ₱{lifetimeIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="font-label-caps text-[10px] uppercase text-blue-200 tracking-widest mb-1">
            {activeWorkspaceId === "ALL" ? "Overall Lifetime Savings" : "Workspace Lifetime Savings"}
          </h2>
          <div className="font-display-currency text-3xl font-bold text-emerald-400">
            ₱{lifetimeSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      {Object.entries(groupedLogs).map(([monthYear, data]) => (
        <section key={monthYear} className="flex flex-col gap-element-gap mt-4 animate-fade-in-up-delay-1">
          <div className="flex items-end justify-between border-b border-outline-variant pb-2 px-1">
            <h3 className="font-headline-md text-headline-md font-bold text-[#001142]">{monthYear}</h3>
          </div>
          
          {/* Month Summary */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
            <div className="flex flex-col flex-1 min-w-0 pr-2">
              <span className="font-label-caps text-[10px] uppercase text-slate-500 truncate font-bold">Income</span>
              <span className="font-display-currency font-bold text-[#001142] text-sm truncate" title={`₱${data.totalIncome.toLocaleString()}`}>
                ₱{data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 px-2 border-l border-slate-200">
              <span className="font-label-caps text-[10px] uppercase text-slate-500 truncate font-bold">Expenses</span>
              <span className="font-display-currency font-bold text-error text-sm truncate" title={`₱${data.totalExpenses.toLocaleString()}`}>
                ₱{data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pl-2 border-l border-slate-200">
              <span className="font-label-caps text-[10px] uppercase text-slate-500 truncate font-bold">Savings</span>
              <span className="font-display-currency font-bold text-emerald-600 text-sm truncate" title={`₱${data.totalSavings.toLocaleString()}`}>
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
                <Link href={`/history/${log.id}`} key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 transition-all active:scale-[0.98] hover:shadow-md hover:border-[#001142]/30 block relative overflow-hidden group">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-col items-start gap-1 mt-1 shrink min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-[#001142] text-white rounded text-[9px] font-bold tracking-widest uppercase whitespace-nowrap">{log.cutoff_type}</span>
                        {activeWorkspaceId === "ALL" && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold tracking-widest uppercase whitespace-nowrap flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">domain</span>
                            {log.company_name || 'Personal'}
                          </span>
                        )}
                        {log.is_pending_sync && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[9px] font-bold tracking-widest uppercase whitespace-nowrap border border-amber-200 animate-pulse flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">cloud_off</span> Pending Sync
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap overflow-hidden text-ellipsis w-full mt-1">
                        {formattedDate} <span className="opacity-50 mx-1">&bull;</span> {formattedTime}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 opacity-80">Savings</span>
                      <div className="font-display-currency font-bold text-emerald-600 text-lg whitespace-nowrap">
                        +₱{Number(log.ipon_goal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Income</span>
                      <span className="font-bold text-[#001142] font-display-currency text-base">₱{Number(log.income).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 px-1">
                      {log.custom_allocations ? (
                        Object.entries(log.custom_allocations).map(([name, amount]) => (
                          <div key={name} className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">{name}</span>
                            <span className="font-semibold text-error font-display-currency text-sm mt-0.5">₱{Number(amount).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">Daily Expenses</span>
                            <span className="font-semibold text-error font-display-currency text-sm mt-0.5">₱{Number(log.daily_expenses).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">Family Support</span>
                            <span className="font-semibold text-error font-display-currency text-sm mt-0.5">₱{Number(log.family_support).toLocaleString()}</span>
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

      {Object.keys(groupedLogs).length === 0 && !loadingMore && (
        <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
          <span className="material-symbols-outlined text-5xl mb-4 text-slate-300">receipt_long</span>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">No logs found</p>
          <p className="text-xs text-slate-400 mt-2">You haven&apos;t saved any paydays for this workspace yet.</p>
        </div>
      )}

      {/* Loading Trigger / Spinner */}
      {(hasMore || loadingMore) && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#001142] rounded-full animate-spin"></div>
        </div>
      )}
      
      {!hasMore && logs.length > 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-body-sm text-[11px] font-bold uppercase tracking-widest">End of History</p>
        </div>
      )}
    </div>
  );
}
