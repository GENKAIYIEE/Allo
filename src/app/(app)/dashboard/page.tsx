"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../../../components/Skeleton";
import { formatInTimeZone } from "date-fns-tz";
import { FINANCIAL_TIPS } from "../../../lib/constants/tips";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cutoff, setCutoff] = useState<"15th" | "30th" | "Monthly">("15th");
  const [salaryCycle, setSalaryCycle] = useState<"bi-monthly" | "monthly">("bi-monthly");
  const [income, setIncome] = useState<string>("");
  type Allocation = {
    id: string;
    name: string;
    icon: string;
    pct: number;
    color: string;
  };
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isSmartMode, setIsSmartMode] = useState(false);
  
  type SmartBracket = {
    id: string;
    name: string;
    threshold: number;
    allocations: Allocation[];
  };
  const [smartBrackets, setSmartBrackets] = useState<SmartBracket[]>([]);
  const [activeBracket, setActiveBracket] = useState<SmartBracket | null>(null);
  
  const [expenseValues, setExpenseValues] = useState<Record<string, string>>({});
  const [loggedCutoffs, setLoggedCutoffs] = useState<string[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [dailyTip, setDailyTip] = useState("");

  useEffect(() => {
    setDailyTip(FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)]);
  }, []);

  useEffect(() => {
    const savedCycle = localStorage.getItem("salary_cycle_v1");
    const currentCycle = savedCycle === "monthly" ? "monthly" : "bi-monthly";
    setSalaryCycle(currentCycle);
    if (currentCycle === "monthly") {
      setCutoff("Monthly");
    }

    const savedAllocations = localStorage.getItem("custom_allocations_v1");
    if (savedAllocations) {
      setAllocations(JSON.parse(savedAllocations));
    } else {
      const savedDaily = localStorage.getItem("budget_daily_pct_v2");
      const savedFamily = localStorage.getItem("budget_family_pct_v2");
      setAllocations([
        { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: savedDaily ? parseInt(savedDaily, 10) : 40, color: "blue" },
        { id: "family", name: "Family Support", icon: "group", pct: savedFamily ? parseInt(savedFamily, 10) : 35, color: "orange" }
      ]);
    }
    
    const savedSmartMode = localStorage.getItem("is_smart_mode_v1");
    if (savedSmartMode === "true") {
      setIsSmartMode(true);
      const savedBrackets = localStorage.getItem("smart_allocation_config_v1");
      if (savedBrackets) {
        setSmartBrackets(JSON.parse(savedBrackets));
      }
    }

    async function fetchLoggedCutoffs() {
      try {
        // Read from cache first for immediate offline support
        const cachedCutoffs = localStorage.getItem("cached_logged_cutoffs_v1");
        if (cachedCutoffs) {
          const cutoffs = JSON.parse(cachedCutoffs);
          setLoggedCutoffs(cutoffs);
          if (currentCycle !== "monthly") {
            if (cutoffs.includes("15th") && !cutoffs.includes("30th")) {
              setCutoff("30th");
            } else if (cutoffs.includes("30th") && !cutoffs.includes("15th")) {
              setCutoff("15th");
            }
          }
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        
        // Use Asia/Manila timezone to reliably get the start of the current month
        const yearMonth = formatInTimeZone(new Date(), "Asia/Manila", "yyyy-MM");
        const startOfMonthIso = `${yearMonth}-01T00:00:00+08:00`;

        // If we're offline, this fetch might throw, but we already have cached data
        const { data, error } = await supabase
          .from("payday_logs")
          .select("cutoff_type")
          .eq("user_id", user.id)
          .gte("created_at", startOfMonthIso);
          
        if (error) throw error;
          
        if (data) {
          const cutoffs = data.map(log => log.cutoff_type);
          setLoggedCutoffs(cutoffs);
          localStorage.setItem("cached_logged_cutoffs_v1", JSON.stringify(cutoffs));
          
          if (currentCycle === "monthly") {
            // Cutoff stays "Monthly"
          } else {
            if (cutoffs.includes("15th") && !cutoffs.includes("30th")) {
              setCutoff("30th");
            } else if (cutoffs.includes("30th") && !cutoffs.includes("15th")) {
              setCutoff("15th");
            }
          }
        }

      } catch (err: unknown) {
        // Only show error if we also have no cached data, otherwise silently degrade to offline mode
        if (!localStorage.getItem("cached_logged_cutoffs_v1")) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data.";
          setErrorMsg(errorMessage);
        }
      } finally {
        // Artificial delay to ensure skeleton animation feels smooth and prevents flickers on fast networks
        setTimeout(() => setIsPageLoading(false), 300);
      }
    }
    fetchLoggedCutoffs();
  }, []);

  const formatCurrencyInput = (value: string) => {
    let rawValue = value.replace(/[^0-9.]/g, '');
    const parts = rawValue.split('.');
    if (parts.length > 2) {
      rawValue = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return parts.join('.');
  };

  const numIncome = parseFloat(income.replace(/,/g, '')) || 0;
  
  const activeAllocationsForCalc = isSmartMode && activeBracket ? activeBracket.allocations : allocations;
  
  const totalExpenses = activeAllocationsForCalc.reduce((sum, alloc) => {
    return sum + (parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0);
  }, 0);
  
  const iponGoal = numIncome - totalExpenses;
  const isOverBudget = totalExpenses > numIncome;

  // The "System" Auto-Budget Logic
  useEffect(() => {
    if (numIncome > 0) {
      let activeAllocs = allocations;
      let matchedBracket = null;
      
      if (isSmartMode && smartBrackets.length > 0) {
        // Find bracket
        if (numIncome < 15000) matchedBracket = smartBrackets.find(b => b.id === 'low');
        else if (numIncome <= 30000) matchedBracket = smartBrackets.find(b => b.id === 'mid');
        else matchedBracket = smartBrackets.find(b => b.id === 'high');
        
        if (matchedBracket) {
          activeAllocs = matchedBracket.allocations;
          setActiveBracket(matchedBracket);
        }
      } else {
        setActiveBracket(null);
      }

      const newValues: Record<string, string> = {};
      activeAllocs.forEach(alloc => {
        newValues[alloc.id] = formatCurrencyInput((numIncome * (alloc.pct / 100)).toFixed(0));
      });
      setExpenseValues(newValues);
    } else {
      setExpenseValues({});
      setActiveBracket(null);
    }
  }, [income, allocations, isSmartMode, smartBrackets]);

  const handleReview = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isOverBudget) {
      setErrorMsg("Expenses cannot exceed your income.");
      return;
    }

    if (numIncome <= 0) {
      setErrorMsg("Please enter a valid income.");
      return;
    }

    // Passed validation! Show the review modal instead of saving immediately.
    setShowReviewModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("You must be logged in to save logs.");
      }

      // Prepare custom allocations payload
      const customAllocations: Record<string, number> = {};
      const activeAllocsToSave = isSmartMode && activeBracket ? activeBracket.allocations : allocations;
      activeAllocsToSave.forEach(alloc => {
        customAllocations[alloc.name] = parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0;
      });

      const numDaily = customAllocations["Daily Expenses"] || 0;
      const numFamily = customAllocations["Family Support"] || 0;

      const payload = {
        user_id: user.id,
        cutoff_type: cutoff,
        income: numIncome,
        daily_expenses: numDaily,
        family_support: numFamily,
        ipon_goal: iponGoal,
        custom_allocations: customAllocations,
        created_at: new Date().toISOString()
      };

      if (!navigator.onLine) {
        // Offline Mode: Save to localStorage Outbox
        const existingQueue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
        existingQueue.push({
          id: `pending-${Date.now()}`,
          ...payload,
          is_pending_sync: true
        });
        localStorage.setItem('offline_sync_queue', JSON.stringify(existingQueue));
        
        // Update cached cutoffs optimistically
        const cachedCutoffs = JSON.parse(localStorage.getItem("cached_logged_cutoffs_v1") || '[]');
        localStorage.setItem("cached_logged_cutoffs_v1", JSON.stringify([...cachedCutoffs, cutoff]));
        
        setSuccessMsg("You are offline. Saved locally, will sync when online!");
      } else {
        // Online Mode: Save directly to Supabase
        const { error: insertError } = await supabase.from("payday_logs").insert(payload);
        if (insertError) throw insertError;
        setSuccessMsg("Successfully saved to history!");
      }

      setIncome("");
      setExpenseValues({});
      setShowReviewModal(false);
      
      setLoggedCutoffs(prev => [...prev, cutoff]);
      if (salaryCycle === "bi-monthly" && cutoff === "15th" && !loggedCutoffs.includes("30th")) {
        setCutoff("30th");
      }
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isMonthCompleted = salaryCycle === "monthly" ? loggedCutoffs.includes("Monthly") : (loggedCutoffs.includes("15th") && loggedCutoffs.includes("30th"));

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 pb-32 font-sans">
      {/* Header */}
      <header className="w-full bg-[#001142] text-white pt-12 pb-6 px-6 rounded-b-3xl shadow-md z-40 relative animate-fade-in-up">
        <div className="flex items-center justify-center">
          <Image 
            src="/allo_logo_v4.png"
            alt="Allo Logo"
            width={48}
            height={48}
            className="rounded-xl shadow-inner transition-transform duration-500 hover:scale-105"
          />
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 -mt-4 relative z-50">
        {/* Segmented Control */}
        {salaryCycle === "monthly" ? (
          <div className="flex bg-[#E2E8F0] rounded-full p-1 mb-6 shadow-sm animate-fade-in-up-delay-1">
            <div className="flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1 bg-white text-slate-800 shadow-sm">
              Monthly Payday {loggedCutoffs.includes("Monthly") && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
            </div>
          </div>
        ) : (
          <div className="flex bg-[#E2E8F0] rounded-full p-1 mb-6 shadow-sm animate-fade-in-up-delay-1">
            <button 
              type="button"
              onClick={() => setCutoff("15th")}
              disabled={loggedCutoffs.includes("15th")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                loggedCutoffs.includes("15th")
                  ? "bg-transparent text-slate-400 opacity-60 cursor-not-allowed"
                  : cutoff === "15th" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              15th Payday {loggedCutoffs.includes("15th") && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
            </button>
            <button 
              type="button"
              onClick={() => setCutoff("30th")}
              disabled={loggedCutoffs.includes("30th")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                loggedCutoffs.includes("30th")
                  ? "bg-transparent text-slate-400 opacity-60 cursor-not-allowed"
                  : cutoff === "30th" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              30th Payday {loggedCutoffs.includes("30th") && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
            </button>
          </div>
        )}

        {isMonthCompleted && (
          <div className="bg-green-100 text-green-800 p-3 rounded-xl text-center text-sm font-bold mb-6 border border-green-200 animate-fade-in-up-delay-1">
            You have successfully logged all paydays for this month! Great job!
          </div>
        )}



        {/* Current Payday Net Income Card */}
        <section className="bg-white p-5 rounded-2xl shadow-sm mb-6 flex flex-col items-center animate-fade-in-up-delay-2 group hover:shadow-md transition-shadow duration-300">
          <h2 className="text-slate-700 font-semibold mb-3">Current Payday Net Income</h2>
          <div className="w-full bg-[#F4F7FA] rounded-xl flex items-center justify-center px-4 py-3 border border-slate-100 min-h-[64px]">
            {isPageLoading ? (
              <Skeleton className="w-40 h-10 bg-slate-200" />
            ) : isMonthCompleted ? (
              <span className="text-slate-400 font-semibold text-xl">Fully Logged</span>
            ) : (
              <>
                <span className="text-3xl font-bold text-slate-800 mr-2">₱</span>
                <input 
                  className="bg-transparent border-none text-3xl font-bold text-slate-800 focus:ring-0 outline-none w-full text-center placeholder-slate-300 p-0" 
                  inputMode="decimal" 
                  placeholder="25,000" 
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(formatCurrencyInput(e.target.value))}
                />
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            {isMonthCompleted 
              ? "You cannot add more logs until next month." 
              : "Enter your net pay for this cut-off"}
          </p>
        </section>



        {/* Budget Allocation Label */}
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="text-slate-700 font-bold">Budget Allocation</h3>
          {isSmartMode && activeBracket && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
              {activeBracket.name} Bracket
            </span>
          )}
        </div>

        {/* Budget Allocations Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up-delay-2">
          {(isSmartMode && activeBracket ? activeBracket.allocations : allocations).map(alloc => {
             const allocValue = parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0;
             const allocPercent = numIncome > 0 ? Math.min((allocValue / numIncome) * 100, 100) : 0;
             
             // Map dynamic colors to actual Tailwind classes
             const colorMap: Record<string, any> = {
               blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-500', placeholder: 'placeholder-blue-300/50', track: 'bg-blue-200/50', fill: 'bg-blue-500' },
               orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-500', placeholder: 'placeholder-orange-300/50', track: 'bg-orange-200/50', fill: 'bg-orange-500' },
               purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', text: 'text-purple-500', placeholder: 'placeholder-purple-300/50', track: 'bg-purple-200/50', fill: 'bg-purple-500' },
               rose: { bg: 'bg-rose-50/50', border: 'border-rose-100', text: 'text-rose-500', placeholder: 'placeholder-rose-300/50', track: 'bg-rose-200/50', fill: 'bg-rose-500' },
               emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-500', placeholder: 'placeholder-emerald-300/50', track: 'bg-emerald-200/50', fill: 'bg-emerald-500' },
               amber: { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-500', placeholder: 'placeholder-amber-300/50', track: 'bg-amber-200/50', fill: 'bg-amber-500' },
               cyan: { bg: 'bg-cyan-50/50', border: 'border-cyan-100', text: 'text-cyan-500', placeholder: 'placeholder-cyan-300/50', track: 'bg-cyan-200/50', fill: 'bg-cyan-500' },
               teal: { bg: 'bg-teal-50/50', border: 'border-teal-100', text: 'text-teal-500', placeholder: 'placeholder-teal-300/50', track: 'bg-teal-200/50', fill: 'bg-teal-500' },
               pink: { bg: 'bg-pink-50/50', border: 'border-pink-100', text: 'text-pink-500', placeholder: 'placeholder-pink-300/50', track: 'bg-pink-200/50', fill: 'bg-pink-500' },
               indigo: { bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-500', placeholder: 'placeholder-indigo-300/50', track: 'bg-indigo-200/50', fill: 'bg-indigo-500' },
             };
             const c = colorMap[alloc.color] || colorMap['blue'];
             
             return (
               <div key={alloc.id} className={`${c.bg} rounded-2xl p-4 shadow-sm border ${c.border} flex flex-col justify-between`}>
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className={`material-symbols-outlined ${c.text} text-lg`} style={{ fontVariationSettings: "'FILL' 1" }}>{alloc.icon}</span>
                     <span className="text-slate-700 font-semibold text-sm truncate">{alloc.name}</span>
                   </div>
                   <div className="flex items-center justify-end mb-2 h-7">
                     {isPageLoading ? (
                       <Skeleton className="w-24 h-6 bg-white/50" />
                     ) : (
                       <>
                         <span className="text-sm font-bold text-slate-800 mr-1">₱</span>
                         <input 
                           className={`bg-transparent border-none text-lg font-bold text-slate-800 focus:ring-0 outline-none w-full text-right ${c.placeholder} p-0`}
                           inputMode="decimal" 
                           placeholder="0" 
                           type="text" 
                           value={expenseValues[alloc.id] || ""}
                           onChange={(e) => setExpenseValues({...expenseValues, [alloc.id]: formatCurrencyInput(e.target.value)})}
                         />
                       </>
                     )}
                   </div>
                 </div>
                 
                 <div className={`w-full ${c.track} rounded-full h-1.5 mt-auto relative overflow-hidden`}>
                   <div className={`${c.fill} h-1.5 rounded-full absolute top-0 left-0 transition-all duration-300`} style={{ width: `${allocPercent}%` }}></div>
                 </div>
               </div>
             );
          })}
        </div>

        {/* Goal / Savings Card */}
        <section className={`rounded-2xl shadow-sm border mb-6 flex flex-col overflow-hidden transition-colors animate-fade-in-up-delay-2 ${
          isOverBudget ? 'bg-red-50 border-red-200' : 'bg-[#EAF6ED] border-green-200'
        }`}>
          <div className="p-5 flex justify-between items-center">
            <div>
              <h2 className="text-slate-700 font-bold text-sm">Goal / Savings</h2>
              <p className="text-xs text-slate-500 mb-2">Neto-computed result</p>
              <div className={`text-3xl font-bold tracking-tight flex items-center h-10 ${isOverBudget ? 'text-red-600' : 'text-[#1B8753]'}`}>
                {isPageLoading ? (
                  <Skeleton className="w-32 h-8 bg-green-900/10" />
                ) : (
                  <>
                    <span className="text-2xl mr-1">₱</span>
                    {iponGoal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className={`material-symbols-outlined text-[14px] ${isOverBudget ? 'text-red-500' : 'text-[#1B8753]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isOverBudget ? 'warning' : 'savings'}
                </span>
                <span className="text-[10px] text-slate-600 font-medium">
                  {isOverBudget ? 'Over budget!' : 'Net Saved this Payday'}
                </span>
              </div>
            </div>
            
            {/* Circular Progress Placeholder Icon */}
            <div className="relative w-16 h-16 mr-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-green-200/50"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isOverBudget ? "text-red-500" : "text-[#28A745]"}
                  strokeDasharray={`${numIncome > 0 && !isOverBudget ? Math.max((iponGoal / numIncome) * 100, 0) : 0}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          {/* Financial Tip inside Goal Card */}
          {dailyTip && !isOverBudget && (
            <div className="px-5 py-3 bg-white/40 border-t border-green-200/50 flex items-start gap-2">
              <span className="material-symbols-outlined text-[#1B8753] text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                lightbulb
              </span>
              <p className="text-xs text-[#1B8753] font-medium leading-relaxed italic">
                {dailyTip}
              </p>
            </div>
          )}
          {isOverBudget && (
            <div className="px-5 py-3 bg-white/40 border-t border-red-200/50 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-600 text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <p className="text-xs text-red-600 font-medium leading-relaxed">
                You exceeded your budget. Please adjust your allocations to save money.
              </p>
            </div>
          )}
        </section>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            {successMsg}
          </div>
        )}

        {/* Submit Button */}
        <button
          disabled={loading || isOverBudget || numIncome <= 0 || isMonthCompleted}
          onClick={() => setShowReviewModal(true)}
          className={`w-full py-4 rounded-2xl font-headline-sm font-bold shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 ${
            loading || isOverBudget || numIncome <= 0 || isMonthCompleted
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-[#1062FE] hover:bg-[#0043CE] text-white hover:shadow-xl'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {loading ? 'sync' : 'receipt_long'}
          </span>
          {loading ? "Processing..." : "Review & Save Log"}
        </button>

      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-outline-variant/30">
            <div className="bg-primary px-6 py-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-3xl">receipt_long</span>
              <div>
                <h3 className="font-headline-md text-white font-bold">Review Summary</h3>
                <p className="text-primary-fixed text-sm opacity-90">{cutoff} Payday Allocation</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-end mb-4 border-b border-outline-variant/30 pb-4">
                <span className="text-on-surface-variant font-label-caps uppercase tracking-wider text-xs">Total Net Income</span>
                <span className="font-display-currency text-primary text-2xl font-bold">₱{numIncome.toLocaleString()}</span>
              </div>
              
              <div className="flex flex-col gap-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Allocations</h4>
                {(isSmartMode && activeBracket ? activeBracket.allocations : allocations).map(alloc => {
                  const val = parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0;
                  return (
                    <div key={alloc.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-${alloc.color}-500 text-[16px]`} style={{ fontVariationSettings: "'FILL' 1" }}>{alloc.icon}</span>
                        <span className="text-on-surface font-medium">{alloc.name}</span>
                      </div>
                      <span className="font-display-currency font-semibold text-error">₱{val.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-secondary-container/30 rounded-xl p-4 border border-secondary/20 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                  <span className="text-on-surface font-bold text-sm">Total Savings</span>
                </div>
                <span className="font-display-currency text-secondary text-xl font-bold">+₱{iponGoal.toLocaleString()}</span>
              </div>
              
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 bg-surface-variant text-on-surface-variant rounded-xl font-bold transition-colors hover:bg-outline-variant/30"
                >
                  Edit
                </button>
                <button 
                  onClick={handleConfirmSave}
                  disabled={loading}
                  className="flex-[2] py-3 bg-primary text-on-primary rounded-xl font-bold transition-colors hover:bg-primary-container hover:text-on-primary-container shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  )}
                  {loading ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
