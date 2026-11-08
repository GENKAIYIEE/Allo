"use client";

import { useEffect, useRef } from "react";

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemSummary?: {
    cutoffType?: string;
    date?: string;
    amount?: number | string;
    amountLabel?: string;
  };
  isDeleting: boolean;
  errorMessage?: string | null;
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

export function DeleteConfirmationDialog({
  isOpen,
  title = "Delete this entry?",
  description = "Are you sure you want to delete this payday entry? This action cannot be undone and will permanently remove it from your records.",
  itemSummary,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const isDeletingRef = useRef(isDeleting);

  useEffect(() => {
    isDeletingRef.current = isDeleting;
  }, [isDeleting]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    
    // Focus Cancel button first to prevent accidental confirmation
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isDeletingRef.current) {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

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
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={isDeleting}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        tabIndex={-1}
        className="w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] animate-in zoom-in-95 duration-200"
      >
        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100/80 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">delete_forever</span>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Permanent Action
            </p>
            <h3 id="delete-dialog-title" className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p id="delete-dialog-description" className="mt-3 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Optional Summary Box for Confirmation Context */}
        {itemSummary && (
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 flex items-center justify-between">
            <div className="flex flex-col">
              {itemSummary.cutoffType && (
                <span className="text-xs font-bold text-slate-800">
                  {itemSummary.cutoffType}
                </span>
              )}
              {itemSummary.date && (
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {itemSummary.date}
                </span>
              )}
            </div>
            {itemSummary.amount !== undefined && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {itemSummary.amountLabel || "Net Savings"}
                </span>
                <span className="font-display-currency text-base font-bold text-slate-900">
                  ₱{typeof itemSummary.amount === "number" 
                    ? itemSummary.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : itemSummary.amount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {isDeleting ? "Cancel" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Deleting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete Entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
