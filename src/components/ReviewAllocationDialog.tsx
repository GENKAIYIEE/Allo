"use client";

import { useEffect, useRef } from "react";

export interface ReviewAllocationItem {
  id: string;
  name: string;
}

interface ReviewAllocationDialogProps {
  cutoff: string;
  income: number;
  allocations: readonly ReviewAllocationItem[];
  expenseValues: Record<string, string>;
  savings: number;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function formatAmount(value: number): string {
  return value.toLocaleString("en-PH", { maximumFractionDigits: 0 });
}

function getAllocationValue(value: string | undefined): number {
  const parsedValue = Number.parseFloat(value?.replace(/,/g, "") ?? "");
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function ReviewAllocationDialog({
  cutoff,
  income,
  allocations,
  expenseValues,
  savings,
  isSaving,
  onClose,
  onConfirm,
}: ReviewAllocationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isSavingRef = useRef(isSaving);

  useEffect(() => {
    isSavingRef.current = isSaving;

    if (isSaving) {
      dialogRef.current?.focus();
    }
  }, [isSaving]);

  useEffect(() => {
    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isSavingRef.current) {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
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
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={isSaving}
        aria-labelledby="review-allocation-title"
        aria-describedby="review-allocation-description"
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] animate-in zoom-in-95 duration-200"
      >
        <header className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Review allocation
              </p>
              <h2 id="review-allocation-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Check your payday plan
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close review"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1062FE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
          <p id="review-allocation-description" className="mt-2 text-sm text-slate-500">
            {cutoff} payday · Review the amounts before saving.
          </p>
        </header>

        <div className="px-5 py-2 sm:px-6">
          <dl>
            <div className="flex items-end justify-between gap-4 border-b border-slate-200 py-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Net income
              </dt>
              <dd className="text-2xl font-bold tracking-tight text-[#001142] tabular-nums">
                ₱{formatAmount(income)}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="review-allocation-list-title" className="py-4">
            <h3
              id="review-allocation-list-title"
              className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              Planned expenses
            </h3>
            <ul className="divide-y divide-slate-100">
              {allocations.map((allocation) => (
                <li key={allocation.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {allocation.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                    ₱{formatAmount(getAllocationValue(expenseValues[allocation.id]))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-end justify-between gap-4 border-t border-slate-200 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Left to save
              </p>
              <p className="mt-1 text-sm text-slate-500">Your payday savings amount</p>
            </div>
            <p className="shrink-0 text-2xl font-bold tracking-tight text-[#087F5B] tabular-nums">
              ₱{formatAmount(savings)}
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#001142] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#10255f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1062FE] focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <span
              className={`material-symbols-outlined text-[19px] ${isSaving ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              {isSaving ? "sync" : "check_circle"}
            </span>
            {isSaving ? "Saving allocation..." : "Confirm & save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="mx-auto mt-3 block rounded-md px-3 py-1 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1062FE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit amounts
          </button>
        </footer>
      </div>
    </div>
  );
}
