"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/client";
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
}

export default function EntryDetailClient({ initialLog }: { initialLog: PaydayLog }) {
  const router = useRouter();
  const supabase = createClient();

  const [log, setLog] = useState<PaydayLog>(initialLog);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit State
  const [editIncome, setEditIncome] = useState(log.income.toString());
  const [editDaily, setEditDaily] = useState(log.daily_expenses.toString());
  const [editFamily, setEditFamily] = useState(log.family_support.toString());
  const [editCustom, setEditCustom] = useState<Record<string, string>>(
    log.custom_allocations 
      ? Object.entries(log.custom_allocations).reduce((acc, [k, v]) => ({ ...acc, [k]: v.toString() }), {}) 
      : {}
  );

  const formattedDate = formatInTimeZone(new Date(log.created_at), 'Asia/Manila', 'MMM d, yyyy');
  const formattedTime = formatInTimeZone(new Date(log.created_at), 'Asia/Manila', 'h:mm a');

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit: revert values
      setEditIncome(log.income.toString());
      setEditDaily(log.daily_expenses.toString());
      setEditFamily(log.family_support.toString());
      setEditCustom(
        log.custom_allocations 
          ? Object.entries(log.custom_allocations).reduce((acc, [k, v]) => ({ ...acc, [k]: v.toString() }), {}) 
          : {}
      );
    }
    setIsEditing(!isEditing);
    setErrorMsg(null);
  };

  const handleDeleteToggle = () => {
    setIsDeleting(!isDeleting);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setLoading(true);

    const numIncome = parseFloat(editIncome) || 0;
    const numDaily = parseFloat(editDaily) || 0;
    const numFamily = parseFloat(editFamily) || 0;
    
    let numCustomTotal = 0;
    const parsedCustom: Record<string, number> = {};
    Object.entries(editCustom).forEach(([key, val]) => {
      const numVal = parseFloat(val) || 0;
      parsedCustom[key] = numVal;
      numCustomTotal += numVal;
    });

    const totalExpenses = numDaily + numFamily + numCustomTotal;
    const newIponGoal = numIncome - totalExpenses;

    const { data, error } = await supabase
      .from("payday_logs")
      .update({
        income: numIncome,
        daily_expenses: numDaily,
        family_support: numFamily,
        custom_allocations: Object.keys(parsedCustom).length > 0 ? parsedCustom : null,
        ipon_goal: newIponGoal
      })
      .eq("id", log.id)
      .eq("user_id", log.user_id)
      .select()
      .single();

    if (error) {
      console.error(error);
      setErrorMsg(error.message || "Failed to update entry.");
      setLoading(false);
      return;
    }

    setLog(data as PaydayLog);
    setIsEditing(false);
    setLoading(false);

    // Refresh history page to update totals
    router.refresh();
  };

  const confirmDelete = async () => {
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase
      .from("payday_logs")
      .delete()
      .eq("id", log.id)
      .eq("user_id", log.user_id);

    if (error) {
      console.error(error);
      setErrorMsg(error.message || "Failed to delete entry.");
      setLoading(false);
      return;
    }

    // Refresh and go back
    router.refresh();
    router.push("/history");
  };

  const currentIponGoal = isEditing 
    ? (parseFloat(editIncome) || 0) - (parseFloat(editDaily) || 0) - (parseFloat(editFamily) || 0) - Object.values(editCustom).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
    : log.ipon_goal;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      
      {errorMsg && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Summary Header */}
      <div className="bg-primary text-on-primary rounded-3xl p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider mb-2 inline-block">
              {log.cutoff_type}
            </span>
            <div className="text-sm font-label-caps opacity-80 mt-1">
              {formattedDate} &bull; {formattedTime}
            </div>
          </div>
          <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
        </div>
        
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Net Savings</h2>
          <div className="text-5xl font-display-currency font-bold tracking-tight">
            ₱{currentIponGoal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="bg-surface rounded-3xl border border-outline-variant/30 p-6 shadow-sm flex flex-col gap-5">
        <h3 className="font-headline-md font-bold text-on-surface border-b border-outline-variant/30 pb-3">Breakdown</h3>
        
        <div className="flex flex-col gap-4">
          
          {/* Income */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Total Income</span>
            {isEditing ? (
              <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-3 py-1 border border-outline-variant/50 w-32">
                <span className="font-bold text-on-surface-variant">₱</span>
                <input 
                  type="number" 
                  value={editIncome} 
                  onChange={(e) => setEditIncome(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-right font-display-currency font-bold text-primary p-0 focus:ring-0"
                />
              </div>
            ) : (
              <span className="font-display-currency font-bold text-primary text-lg">
                ₱{Number(log.income).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          <div className="h-px w-full bg-outline-variant/20 my-1"></div>

          {/* Core Expenses */}
          {!log.custom_allocations || Object.keys(log.custom_allocations).length === 0 ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Daily Expenses</span>
                {isEditing ? (
                  <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-3 py-1 border border-outline-variant/50 w-32">
                    <span className="font-bold text-on-surface-variant">₱</span>
                    <input 
                      type="number" 
                      value={editDaily} 
                      onChange={(e) => setEditDaily(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-right font-display-currency font-bold text-error p-0 focus:ring-0"
                    />
                  </div>
                ) : (
                  <span className="font-display-currency font-bold text-error text-lg">
                    ₱{Number(log.daily_expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Family Support</span>
                {isEditing ? (
                  <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-3 py-1 border border-outline-variant/50 w-32">
                    <span className="font-bold text-on-surface-variant">₱</span>
                    <input 
                      type="number" 
                      value={editFamily} 
                      onChange={(e) => setEditFamily(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-right font-display-currency font-bold text-error p-0 focus:ring-0"
                    />
                  </div>
                ) : (
                  <span className="font-display-currency font-bold text-error text-lg">
                    ₱{Number(log.family_support).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Custom Allocations */
            Object.entries(log.custom_allocations).map(([name, val]) => (
              <div key={name} className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant truncate pr-4">{name}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-3 py-1 border border-outline-variant/50 w-32 shrink-0">
                    <span className="font-bold text-on-surface-variant">₱</span>
                    <input 
                      type="number" 
                      value={editCustom[name] || ""} 
                      onChange={(e) => setEditCustom(prev => ({ ...prev, [name]: e.target.value }))}
                      className="bg-transparent border-none outline-none w-full text-right font-display-currency font-bold text-error p-0 focus:ring-0"
                    />
                  </div>
                ) : (
                  <span className="font-display-currency font-bold text-error text-lg shrink-0">
                    ₱{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            ))
          )}

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {isDeleting ? (
          <>
            <button 
              onClick={handleDeleteToggle}
              disabled={loading}
              className="flex-1 py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-bold transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={loading}
              className="flex-[2] py-4 bg-error text-on-error rounded-2xl font-bold transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              )}
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </>
        ) : isEditing ? (
          <>
            <button 
              onClick={handleEditToggle}
              disabled={loading}
              className="flex-1 py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-bold transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] py-4 bg-primary text-on-primary rounded-2xl font-bold transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">save</span>
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleDeleteToggle}
              className="flex-1 py-4 bg-error-container text-on-error-container hover:bg-error hover:text-on-error rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Delete
            </button>
            <button 
              onClick={handleEditToggle}
              className="flex-[2] py-4 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit Entry
            </button>
          </>
        )}
      </div>

    </div>
  );
}
