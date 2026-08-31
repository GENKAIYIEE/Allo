"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../../../components/Skeleton";
import { formatInTimeZone } from "date-fns-tz";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cutoff, setCutoff] = useState<"15th" | "30th">("15th");
  const [income, setIncome] = useState<string>("");
  type Allocation = {
    id: string;
    name: string;
    icon: string;
    pct: number;
    color: string;
  };
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [expenseValues, setExpenseValues] = useState<Record<string, string>>({});
  const [loggedCutoffs, setLoggedCutoffs] = useState<string[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isInPenaltyZone, setIsInPenaltyZone] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
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

    async function fetchLoggedCutoffs() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        
        // Use Asia/Manila timezone to reliably get the start of the current month
        const yearMonth = formatInTimeZone(new Date(), "Asia/Manila", "yyyy-MM");
        const startOfMonthIso = `${yearMonth}-01T00:00:00+08:00`;

        const { data, error } = await supabase
          .from("payday_logs")
          .select("cutoff_type")
          .eq("user_id", user.id)
          .gte("created_at", startOfMonthIso);
          
        if (error) throw error;
          
        if (data) {
          const cutoffs = data.map(log => log.cutoff_type);
          setLoggedCutoffs(cutoffs);
          
          if (cutoffs.includes("15th") && !cutoffs.includes("30th")) {
            setCutoff("30th");
          } else if (cutoffs.includes("30th") && !cutoffs.includes("15th")) {
            setCutoff("15th");
          }
        }

        // Check Penalty Zone logic (if the user was over budget in their last 2 paydays)
        const { data: recentLogs, error: recentError } = await supabase
          .from("payday_logs")
          .select("ipon_goal")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2);
          
        if (recentError) throw recentError;
          
        if (recentLogs && recentLogs.length === 2) {
          if (recentLogs[0].ipon_goal < 0 && recentLogs[1].ipon_goal < 0) {
            setIsInPenaltyZone(true);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data.";
        setErrorMsg(errorMessage);
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
  
  const totalExpenses = allocations.reduce((sum, alloc) => {
    return sum + (parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0);
  }, 0);
  
  const iponGoal = numIncome - totalExpenses;
  const isOverBudget = totalExpenses > numIncome;
  const penaltySavingsRequired = isInPenaltyZone ? numIncome * 0.2 : 0;
  const isViolatingPenalty = isInPenaltyZone && iponGoal < penaltySavingsRequired;

  // The "System" Auto-Budget Logic
  useEffect(() => {
    if (numIncome > 0) {
      const newValues: Record<string, string> = {};
      allocations.forEach(alloc => {
        newValues[alloc.id] = formatCurrencyInput((numIncome * (alloc.pct / 100)).toFixed(0));
      });
      setExpenseValues(newValues);
    } else {
      setExpenseValues({});
    }
  }, [income, allocations]);

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

    if (isViolatingPenalty) {
      setErrorMsg(`PENALTY ZONE ACTIVE: You must save at least 20% (₱${penaltySavingsRequired.toLocaleString()}) this payday.`);
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
      allocations.forEach(alloc => {
        customAllocations[alloc.name] = parseFloat(expenseValues[alloc.id]?.replace(/,/g, '')) || 0;
      });

      // Legacy fallback for required columns
      const numDaily = customAllocations["Daily Expenses"] || 0;
      const numFamily = customAllocations["Family Support"] || 0;

      const { error: insertError } = await supabase.from("payday_logs").insert({
        user_id: user.id,
        cutoff_type: cutoff,
        income: numIncome,
        daily_expenses: numDaily,
        family_support: numFamily,
        ipon_goal: iponGoal,
        custom_allocations: customAllocations
      });

      if (insertError) throw insertError;

      setSuccessMsg("Successfully saved to history!");
      setIncome("");
      setExpenseValues({});
      setShowReviewModal(false);
      
      setLoggedCutoffs(prev => [...prev, cutoff]);
      if (cutoff === "15th" && !loggedCutoffs.includes("30th")) {
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

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 pb-32 font-sans">
      {/* Header */}
      <header className="w-full bg-[#001142] text-white pt-12 pb-6 px-6 rounded-b-3xl shadow-md z-40 relative animate-fade-in-up">
        <div className="flex items-center justify-center">
          <Image 
            src="/allo_logo_transparent.png"
            alt="Allo Logo"
            width={48}
            height={48}
            className="rounded-xl shadow-inner transition-transform duration-500 hover:scale-105"
          />
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 -mt-4 relative z-50">
        {/* Segmented Control */}
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

        {loggedCutoffs.includes("15th") && loggedCutoffs.includes("30th") && (
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
          <p className="text-xs text-slate-400 mt-3">Enter your net pay for this cut-off</p>
        </section>

        {/* System Quests */}
        {numIncome > 0 && (
          <section className={`p-4 rounded-xl shadow-sm mb-6 border ${isInPenaltyZone ? 'bg-red-950 text-red-100 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse' : isOverBudget ? 'bg-orange-900 text-orange-100 border-orange-500' : 'bg-blue-900 text-blue-100 border-blue-500'} font-mono relative overflow-hidden transition-all duration-500 animate-fade-in-up-delay-2`}>
            {/* Scanline overlay for quests */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0 pointer-events-none opacity-30"></div>
            
            <div className="relative z-10 flex items-start gap-3">
              <span className="material-symbols-outlined text-3xl mt-1">
                {isInPenaltyZone ? 'gavel' : isOverBudget ? 'warning' : 'task_alt'}
              </span>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm opacity-80">
                  {isInPenaltyZone ? '[SYSTEM] PENALTY ZONE ACTIVE' : isOverBudget ? '[SYSTEM] EMERGENCY QUEST' : '[SYSTEM] DAILY QUEST'}
                </h3>
                <p className="text-sm mt-1">
                  {isInPenaltyZone 
                    ? `You failed the budget twice in a row! Penalty constraint applied: You MUST save 20% (₱${penaltySavingsRequired.toLocaleString()}) this payday to lift the penalty.`
                    : isOverBudget 
                    ? "You exceeded the budget! Cut back tomorrow and save. No luxury spending!" 
                    : "Do not spend more than ₱500 today. Stick to the budget!"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Budget Allocation Label */}
        <h3 className="text-slate-700 font-bold mb-3 px-1">Budget Allocation</h3>

        {/* Budget Allocations Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up-delay-2">
          {allocations.map(alloc => {
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
        <section className={`rounded-2xl p-5 shadow-sm border mb-6 flex justify-between items-center transition-colors animate-fade-in-up-delay-2 ${
          isOverBudget ? 'bg-red-50 border-red-200' : 'bg-[#EAF6ED] border-green-200'
        }`}>
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
          type="button"
          onClick={handleReview}
          disabled={loading || isOverBudget || numIncome <= 0 || (loggedCutoffs.includes("15th") && loggedCutoffs.includes("30th"))}
          className={`w-full py-4 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${
            loading || isOverBudget || numIncome <= 0 || (loggedCutoffs.includes("15th") && loggedCutoffs.includes("30th"))
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-container'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                {allocations.map(alloc => {
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
