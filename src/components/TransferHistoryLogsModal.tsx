"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../lib/supabase/client";
import { formatInTimeZone } from "date-fns-tz";
import { CareerProfile } from "./EditCareerProfileDialog";

interface TransferHistoryLogsModalProps {
  isOpen: boolean;
  targetProfile: CareerProfile | null;
  allProfiles: CareerProfile[];
  onClose: () => void;
  onSuccess: (count: number, sourceCompany: string, targetCompany: string) => void;
}

interface PaydayLogSummary {
  id: string;
  cutoff_type: string;
  income: number;
  company_name: string;
  income_source: string;
  created_at: string;
}

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function TransferHistoryLogsModal({
  isOpen,
  targetProfile,
  allProfiles,
  onClose,
  onSuccess,
}: TransferHistoryLogsModalProps) {
  const supabase = createClient();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [availableLogs, setAvailableLogs] = useState<PaydayLogSummary[]>([]);
  const [sourceCompany, setSourceCompany] = useState<string>("Personal");
  const [selectedTarget, setSelectedTarget] = useState<CareerProfile | null>(targetProfile);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync target profile when opened
  useEffect(() => {
    if (targetProfile) {
      setSelectedTarget(targetProfile);
    } else if (allProfiles.length > 0) {
      setSelectedTarget(allProfiles[0]);
    }
  }, [targetProfile, allProfiles, isOpen]);

  // Load existing logs from Supabase
  useEffect(() => {
    if (!isOpen) return;

    async function loadLogs() {
      setIsLoadingLogs(true);
      setErrorMsg(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg("You must be signed in to transfer logs.");
        setIsLoadingLogs(false);
        return;
      }

      const { data, error } = await supabase
        .from("payday_logs")
        .select("id, cutoff_type, income, company_name, income_source, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load logs:", error);
        setErrorMsg("Failed to load history logs.");
        setIsLoadingLogs(false);
        return;
      }

      const logs: PaydayLogSummary[] = (data || []).map((item) => ({
        ...item,
        company_name: item.company_name || "Personal",
        income_source: item.income_source || "Primary Role",
      }));

      setAvailableLogs(logs);

      // Distinct companies in history
      const distinctCompanies = Array.from(new Set(logs.map((l) => l.company_name)));

      // Auto-select source company: Prioritize "Personal" if it exists and has logs, or first company different from target
      if (distinctCompanies.includes("Personal")) {
        setSourceCompany("Personal");
      } else if (distinctCompanies.length > 0) {
        const otherComp = distinctCompanies.find((c) => c !== selectedTarget?.company) || distinctCompanies[0];
        setSourceCompany(otherComp);
      }

      setIsLoadingLogs(false);
    }

    loadLogs();
  }, [isOpen, supabase]);

  // Update selected IDs whenever source company or available logs change
  useEffect(() => {
    const matchingLogs = availableLogs.filter((l) => l.company_name === sourceCompany);
    setSelectedLogIds(matchingLogs.map((l) => l.id));
  }, [sourceCompany, availableLogs]);

  // Focus trap and accessibility
  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isTransferring) onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus({ preventScroll: true });
    };
  }, [isOpen, isTransferring, onClose]);

  if (!isOpen) return null;

  // Compute distinct source companies available in history
  const distinctCompanies = Array.from(new Set(availableLogs.map((l) => l.company_name)));
  const matchingSourceLogs = availableLogs.filter((l) => l.company_name === sourceCompany);

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogIds.length === matchingSourceLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(matchingSourceLogs.map((l) => l.id));
    }
  };

  const handleExecuteTransfer = async () => {
    if (!selectedTarget) {
      setErrorMsg("Please select a target career profile.");
      return;
    }

    if (selectedLogIds.length === 0) {
      setErrorMsg("Please select at least one log to transfer.");
      return;
    }

    if (sourceCompany === selectedTarget.company) {
      setErrorMsg("Source and target workspaces must be different.");
      return;
    }

    setIsTransferring(true);
    setErrorMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("User session not found.");
      setIsTransferring(false);
      return;
    }

    const { error } = await supabase
      .from("payday_logs")
      .update({
        company_name: selectedTarget.company,
        income_source: selectedTarget.role,
      })
      .in("id", selectedLogIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("Transfer error:", error);
      setErrorMsg(error.message || "Failed to transfer logs.");
      setIsTransferring(false);
      return;
    }

    const count = selectedLogIds.length;
    setIsTransferring(false);
    onSuccess(count, sourceCompany, selectedTarget.company);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isTransferring) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </div>
            <div>
              <h3 id="transfer-modal-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
                Transfer Past Logs
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Reassign existing history to a career profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferring}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 flex flex-col gap-4 pr-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {isLoadingLogs ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
              <span className="text-xs font-medium">Scanning your history logs...</span>
            </div>
          ) : availableLogs.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <span className="material-symbols-outlined text-slate-300 text-3xl mb-1">history_toggle_off</span>
              <p className="text-xs font-bold text-slate-700">No History Logs Found</p>
              <p className="text-[11px] text-slate-400 mt-1">You haven&apos;t logged any paydays yet.</p>
            </div>
          ) : (
            <>
              {/* Source & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source Selection */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-slate-400">arrow_forward</span>
                    Transfer From
                  </label>
                  <select
                    value={sourceCompany}
                    onChange={(e) => setSourceCompany(e.target.value)}
                    disabled={isTransferring}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {distinctCompanies.map((comp) => {
                      const count = availableLogs.filter((l) => l.company_name === comp).length;
                      return (
                        <option key={comp} value={comp}>
                          {comp} ({count} log{count === 1 ? "" : "s"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Target Selection */}
                <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">domain</span>
                    Transfer To
                  </label>
                  <select
                    value={selectedTarget?.id || ""}
                    onChange={(e) => {
                      const found = allProfiles.find((p) => p.id === e.target.value);
                      if (found) setSelectedTarget(found);
                    }}
                    disabled={isTransferring}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {allProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.company} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matching Logs Preview & Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Matching Logs ({matchingSourceLogs.length})
                  </span>
                  {matchingSourceLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={isTransferring}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {selectedLogIds.length === matchingSourceLogs.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {matchingSourceLogs.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
                    No logs currently assigned to &quot;{sourceCompany}&quot;.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-0.5">
                    {matchingSourceLogs.map((log) => {
                      const isChecked = selectedLogIds.includes(log.id);
                      const formattedDate = formatInTimeZone(
                        new Date(log.created_at),
                        "Asia/Manila",
                        "MMM d, yyyy • h:mm a"
                      );

                      return (
                        <div
                          key={log.id}
                          onClick={() => !isTransferring && toggleSelectLog(log.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-indigo-50/50 border-indigo-300 text-slate-900 font-medium"
                              : "bg-white border-slate-200 text-slate-600 opacity-70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              disabled={isTransferring}
                              className="size-4 rounded text-primary focus:ring-0 cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-700">
                                  {log.cutoff_type}
                                </span>
                                <span className="truncate">{formattedDate}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-display-currency font-bold text-slate-900 shrink-0 ml-2">
                            ₱{Number(log.income).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferring}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteTransfer}
            disabled={
              isTransferring ||
              isLoadingLogs ||
              selectedLogIds.length === 0 ||
              sourceCompany === selectedTarget?.company
            }
            className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-[#001142] to-[#00236f] text-white font-bold text-xs transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
          >
            {isTransferring ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Transferring...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
                Transfer {selectedLogIds.length} Log{selectedLogIds.length === 1 ? "" : "s"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
