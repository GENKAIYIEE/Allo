"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/client";
import { formatInTimeZone } from "date-fns-tz";
import { DeleteConfirmationDialog } from "../../../../components/DeleteConfirmationDialog";

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

interface CareerProfile {
  id: string;
  role: string;
  company: string;
}

export default function EntryDetailClient({ initialLog }: { initialLog: PaydayLog }) {
  const router = useRouter();
  const supabase = createClient();

  const [log, setLog] = useState<PaydayLog>(initialLog);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Career Workspaces
  const [savedProfiles, setSavedProfiles] = useState<CareerProfile[]>([]);
  const [editCompany, setEditCompany] = useState<string>(initialLog.company_name || "Personal");
  const [editRole, setEditRole] = useState<string>(initialLog.income_source || "Primary Role");
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

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

  // Load available career profiles
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("saved_career_profiles_v1");
        if (raw) {
          setSavedProfiles(JSON.parse(raw));
        }
      }
    } catch (e) {
      console.error("Error loading saved career profiles:", e);
    }
  }, []);

  // Close workspace dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsWorkspaceDropdownOpen(false);
      }
    };

    if (isWorkspaceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWorkspaceDropdownOpen]);

  const handleEditToggle = () => {
    setIsWorkspaceDropdownOpen(false);
    if (isEditing) {
      // Cancel edit: revert values
      setEditIncome(log.income.toString());
      setEditDaily(log.daily_expenses.toString());
      setEditFamily(log.family_support.toString());
      setEditCompany(log.company_name || "Personal");
      setEditRole(log.income_source || "Primary Role");
      setEditCustom(
        log.custom_allocations 
          ? Object.entries(log.custom_allocations).reduce((acc, [k, v]) => ({ ...acc, [k]: v.toString() }), {}) 
          : {}
      );
    }
    setIsEditing(!isEditing);
    setErrorMsg(null);
  };

  const handleOpenDeleteDialog = () => {
    setDeleteErrorMsg(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (!loading) {
      setIsDeleteDialogOpen(false);
      setDeleteErrorMsg(null);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setLoading(true);

    const numIncome = parseFloat(editIncome) || 0;
    const numDaily = parseFloat(editDaily) || 0;
    const numFamily = parseFloat(editFamily) || 0;
    
    const hasCustom = Boolean(log.custom_allocations && Object.keys(log.custom_allocations).length > 0);

    let totalExpenses = 0;
    let finalDaily = numDaily;
    let finalFamily = numFamily;
    let finalCustom: Record<string, number> | null = null;

    if (hasCustom) {
      const parsedCustom: Record<string, number> = {};
      Object.entries(editCustom).forEach(([key, val]) => {
        const numVal = parseFloat(val) || 0;
        parsedCustom[key] = numVal;
        totalExpenses += numVal;
      });
      finalCustom = Object.keys(parsedCustom).length > 0 ? parsedCustom : null;
      finalDaily = parsedCustom["Daily Expenses"] ?? numDaily;
      finalFamily = parsedCustom["Family Support"] ?? numFamily;
    } else {
      totalExpenses = numDaily + numFamily;
    }

    const newIponGoal = numIncome - totalExpenses;

    const { data, error } = await supabase
      .from("payday_logs")
      .update({
        income: numIncome,
        daily_expenses: finalDaily,
        family_support: finalFamily,
        custom_allocations: finalCustom,
        ipon_goal: newIponGoal,
        company_name: editCompany,
        income_source: editRole
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

  const handleConfirmDelete = async () => {
    setDeleteErrorMsg(null);
    setLoading(true);

    try {
      // Remove from offline queue if it was pending
      const queueRaw = localStorage.getItem("offline_sync_queue");
      if (queueRaw) {
        const queue = JSON.parse(queueRaw);
        if (Array.isArray(queue)) {
          const filtered = queue.filter((item: { id: string }) => item.id !== log.id);
          localStorage.setItem("offline_sync_queue", JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.error("Error updating offline queue on delete:", e);
    }

    const { error } = await supabase
      .from("payday_logs")
      .delete()
      .eq("id", log.id)
      .eq("user_id", log.user_id);

    if (error) {
      console.error(error);
      setDeleteErrorMsg(error.message || "Failed to delete entry. Please try again.");
      setLoading(false);
      return;
    }

    setIsDeleteDialogOpen(false);
    setLoading(false);

    // Refresh and go back
    router.refresh();
    router.push("/history");
  };

  const hasCustomAllocations = Boolean(log.custom_allocations && Object.keys(log.custom_allocations).length > 0);

  const currentExpenses = hasCustomAllocations
    ? Object.values(editCustom).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
    : (parseFloat(editDaily) || 0) + (parseFloat(editFamily) || 0);

  const currentIponGoal = isEditing 
    ? (parseFloat(editIncome) || 0) - currentExpenses
    : log.ipon_goal;

  const workspaceOptions: { id: string; company: string; role: string }[] = [
    ...savedProfiles.map((p) => ({ id: p.id, company: p.company, role: p.role || "General" })),
    ...(!savedProfiles.some((p) => p.company === "Personal")
      ? [{ id: "personal_default", company: "Personal", role: "General" }]
      : []),
  ];

  if (!workspaceOptions.some((w) => w.company === editCompany)) {
    workspaceOptions.unshift({
      id: "current_custom",
      company: editCompany,
      role: editRole,
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      
      {errorMsg && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Summary Header */}
      <div className="bg-gradient-to-br from-[#001142] to-[#00236f] text-on-primary rounded-3xl p-7 shadow-xl shadow-primary/20 flex flex-col gap-4 relative overflow-hidden border border-white/10">
        {/* Decorative subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider inline-block">
                {log.cutoff_type}
              </span>
              <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1.5 border border-white/10 max-w-[200px]">
                <span className="material-symbols-outlined text-[13px] shrink-0">domain</span>
                <span className="truncate">{log.company_name || "Personal"}</span>
              </span>
            </div>
            <div className="text-sm font-label-caps opacity-80 mt-1">
              {formattedDate} &bull; {formattedTime}
              {log.income_source && (
                <span className="opacity-90 ml-1.5 font-medium">&bull; {log.income_source}</span>
              )}
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
      <div className="bg-white rounded-3xl border border-outline-variant/20 p-7 shadow-xl shadow-primary/5 flex flex-col gap-5 relative">
        <h3 className="text-lg font-extrabold text-on-surface border-b border-outline-variant/20 pb-4 tracking-wide">Breakdown</h3>
        
        <div className="flex flex-col gap-5">
          
          {/* Workspace */}
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant shrink-0">
              Workspace
            </span>
            {isEditing ? (
              <div className="relative" ref={workspaceDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsWorkspaceDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 bg-surface-container-high rounded-lg px-2.5 py-1 border border-outline-variant/50 hover:border-primary/40 transition-colors cursor-pointer text-right"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-primary truncate max-w-[130px]">
                      {editCompany}
                    </span>
                    {editRole && (
                      <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[130px]">
                        {editRole}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    {isWorkspaceDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {isWorkspaceDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-outline-variant/30 rounded-xl shadow-xl shadow-black/10 z-30 py-1 overflow-hidden">
                    {workspaceOptions.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setEditCompany(w.company);
                          setEditRole(w.role || "Primary Role");
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3.5 py-2 hover:bg-surface-variant/40 transition-colors flex flex-col items-end cursor-pointer ${
                          editCompany === w.company ? "bg-primary/5 text-primary" : "text-on-surface"
                        }`}
                      >
                        <span className="text-xs font-bold">{w.company}</span>
                        {w.role && (
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {w.role}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-end text-right min-w-0">
                <span className="font-bold text-on-surface text-base truncate max-w-[180px]">
                  {log.company_name || "Personal"}
                </span>
                {log.income_source && (
                  <span className="text-xs text-on-surface-variant font-medium mt-0.5 truncate max-w-[180px]">
                    {log.income_source}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="h-px w-full bg-outline-variant/10 my-1"></div>
          
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

          <div className="h-px w-full bg-outline-variant/10 my-1"></div>

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
      <div className="flex gap-3 mt-2">
        {isEditing ? (
          <>
            <button 
              type="button"
              onClick={handleEditToggle}
              disabled={loading}
              className="flex-1 py-3.5 bg-surface-variant text-on-surface-variant rounded-xl font-bold transition-all active:scale-[0.98] border border-outline-variant/30 hover:bg-surface-variant/80 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] py-3.5 bg-gradient-to-r from-primary to-[#00236f] text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary/30 flex items-center justify-center gap-2 border border-primary/20 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
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
              type="button"
              onClick={handleOpenDeleteDialog}
              disabled={loading}
              className="flex-1 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-red-100 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Delete
            </button>
            <button 
              type="button"
              onClick={handleEditToggle}
              disabled={loading}
              className="flex-[2] py-3.5 bg-gradient-to-r from-primary to-[#00236f] text-white hover:shadow-lg hover:shadow-primary/30 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-primary/20 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit Entry
            </button>
          </>
        )}
      </div>

      {/* Delete Confirmation Popup Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        isDeleting={loading}
        errorMessage={deleteErrorMsg}
        title="Delete this entry?"
        description="Are you sure you want to delete this payday entry? This action cannot be undone and will permanently remove this record from your history."
        itemSummary={{
          cutoffType: `${log.cutoff_type} • ${log.company_name || "Personal"}`,
          date: `${formattedDate} • ${formattedTime}`,
          amount: currentIponGoal,
          amountLabel: "Net Savings",
        }}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}
