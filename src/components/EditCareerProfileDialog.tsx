"use client";

import { useState, useEffect, useRef } from "react";

export interface CareerProfile {
  id: string;
  role: string;
  company: string;
}

interface EditCareerProfileDialogProps {
  isOpen: boolean;
  profile: CareerProfile | null;
  existingProfiles: CareerProfile[];
  onClose: () => void;
  onSave: (updatedProfile: CareerProfile) => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function EditCareerProfileDialog({
  isOpen,
  profile,
  existingProfiles,
  onClose,
  onSave,
}: EditCareerProfileDialogProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setCompany(profile.company);
      setRole(profile.role);
      setErrorMsg(null);
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      companyInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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

  if (!isOpen || !profile) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCompany = company.trim();
    const cleanRole = role.trim();

    if (!cleanCompany || !cleanRole) {
      setErrorMsg("Please fill out both company and job title.");
      return;
    }

    // Check for duplicate with other profiles
    const isDuplicate = existingProfiles.some(
      (p) =>
        p.id !== profile.id &&
        p.company.toLowerCase() === cleanCompany.toLowerCase() &&
        p.role.toLowerCase() === cleanRole.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg(`A profile for "${cleanRole}" at "${cleanCompany}" already exists.`);
      return;
    }

    onSave({
      ...profile,
      company: cleanCompany,
      role: cleanRole,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        tabIndex={-1}
        className="w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100/80">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </div>
            <div>
              <h3 id="edit-profile-title" className="text-lg font-bold text-slate-900">
                Edit Career Profile
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Update your company or role</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Company / Business Name
            </label>
            <input
              ref={companyInputRef}
              type="text"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. Acme Corp, Freelance"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Job Title / Income Source
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. Lead Developer, Consultant"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>

          <div className="mt-2 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!company.trim() || !role.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#001142] to-[#00236f] text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
