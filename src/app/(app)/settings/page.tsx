"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "../../../../lib/supabase/client";
import { Skeleton } from "../../../components/Skeleton";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Budget formula states
  type Allocation = {
    id: string;
    name: string;
    icon: string;
    pct: number;
    color: string;
  };

  type SmartBracket = {
    id: string;
    name: string;
    threshold: number;
    allocations: Allocation[];
  };

  const defaultAllocations: Allocation[] = [
    { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: 40, color: "blue" },
    { id: "family", name: "Family Support", icon: "group", pct: 35, color: "orange" }
  ];

  const defaultSmartBrackets: SmartBracket[] = [
    {
      id: "low",
      name: "Below ₱15,000",
      threshold: 15000,
      allocations: [
        { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: 70, color: "blue" },
        { id: "family", name: "Family Support", icon: "group", pct: 20, color: "orange" }
      ]
    },
    {
      id: "mid",
      name: "₱15,000 - ₱30,000",
      threshold: 30000,
      allocations: [
        { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: 50, color: "blue" },
        { id: "family", name: "Family Support", icon: "group", pct: 30, color: "orange" }
      ]
    },
    {
      id: "high",
      name: "Above ₱30,000",
      threshold: Infinity,
      allocations: [
        { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: 40, color: "blue" },
        { id: "family", name: "Family Support", icon: "group", pct: 35, color: "orange" }
      ]
    }
  ];

  const [allocations, setAllocations] = useState<Allocation[]>(defaultAllocations);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [smartBrackets, setSmartBrackets] = useState<SmartBracket[]>(defaultSmartBrackets);
  const [expandedBracket, setExpandedBracket] = useState<string | null>("low");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPct, setNewCatPct] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Modals
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showSalaryCycleModal, setShowSalaryCycleModal] = useState(false);
  const [showBudgetFormulaModal, setShowBudgetFormulaModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Salary cycle
  const [salaryCycle, setSalaryCycle] = useState<"bi-monthly" | "monthly">("bi-monthly");
  const [isSavingCycle, setIsSavingCycle] = useState(false);
  const [saveCycleSuccess, setSaveCycleSuccess] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();

    // Load saved preferences
    const savedCycle = localStorage.getItem("salary_cycle_v1");
    if (savedCycle === "monthly" || savedCycle === "bi-monthly") {
      setSalaryCycle(savedCycle);
    }

    const savedAllocations = localStorage.getItem("custom_allocations_v1");
    if (savedAllocations) {
      setAllocations(JSON.parse(savedAllocations));
    } else {
      const savedDaily = localStorage.getItem("budget_daily_pct_v2");
      const savedFamily = localStorage.getItem("budget_family_pct_v2");
      if (savedDaily || savedFamily) {
        setAllocations([
          { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: savedDaily ? parseInt(savedDaily, 10) : 40, color: "blue" },
          { id: "family", name: "Family Support", icon: "group", pct: savedFamily ? parseInt(savedFamily, 10) : 35, color: "orange" }
        ]);
      }
    }

    const savedSmartMode = localStorage.getItem("is_smart_mode_v1");
    if (savedSmartMode === "true") {
      setIsSmartMode(true);
    }
    const savedSmartBrackets = localStorage.getItem("smart_allocation_config_v1");
    if (savedSmartBrackets) {
      setSmartBrackets(JSON.parse(savedSmartBrackets));
    }
  }, [supabase.auth]);

  const handleSaveCycle = (cycle: "bi-monthly" | "monthly") => {
    setSalaryCycle(cycle);
    setIsSavingCycle(true);
    setTimeout(() => {
      localStorage.setItem("salary_cycle_v1", cycle);
      setIsSavingCycle(false);
      setSaveCycleSuccess(true);
      setTimeout(() => setSaveCycleSuccess(false), 2000);
    }, 400);
  };

  const handleSaveFormula = () => {
    if (isSmartMode) {
      for (const bracket of smartBrackets) {
        const total = bracket.allocations.reduce((sum, a) => sum + a.pct, 0);
        if (total > 100) {
          alert(`Your allocations in ${bracket.name} exceed 100%. Please reduce a category.`);
          return;
        }
      }
    } else {
      const total = allocations.reduce((sum, a) => sum + a.pct, 0);
      if (total > 100) {
        alert("Your total allocations exceed 100%. Please reduce a category or use Auto-Balance.");
        return;
      }
    }

    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("is_smart_mode_v1", isSmartMode ? "true" : "false");
      if (isSmartMode) {
        localStorage.setItem("smart_allocation_config_v1", JSON.stringify(smartBrackets));
      } else {
        localStorage.setItem("custom_allocations_v1", JSON.stringify(allocations));
      }
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleAutoBalance = (currentAllocs: Allocation[]) => {
    const customAllocs = currentAllocs.filter(a => a.id !== 'daily' && a.id !== 'family');

    if (customAllocs.length === 0) {
      return currentAllocs.map(a => {
        if (a.id === 'daily') return { ...a, pct: 40 };
        if (a.id === 'family') return { ...a, pct: 35 };
        return a;
      });
    }

    const savingsPct = 20;
    let dailyPct = 35;
    let familyPct = 25;

    let remaining = 100 - savingsPct - dailyPct - familyPct;
    let customPct = Math.floor(remaining / customAllocs.length);
    let remainder = remaining % customAllocs.length;

    if (customPct < 5) {
      customPct = 5;
      const totalCustomNeed = customPct * customAllocs.length;
      remaining = 100 - savingsPct - totalCustomNeed;
      dailyPct = Math.floor(remaining * 0.6);
      familyPct = remaining - dailyPct;
    }

    return currentAllocs.map(a => {
      if (a.id === 'daily') return { ...a, pct: dailyPct + remainder };
      if (a.id === 'family') return { ...a, pct: familyPct };
      return { ...a, pct: customPct };
    });
  };

  const confirmLogout = async () => {
    document.cookie = "app_unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteAccountError("Please type DELETE in uppercase to confirm.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: deleteConfirmText }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setDeleteAccountError(result.error || "Failed to delete account. Please try again.");
        setIsDeletingAccount(false);
        return;
      }

      // Clear local Allo preferences and caches on device
      const alloLocalStorageKeys = [
        "salary_cycle_v1",
        "custom_allocations_v1",
        "budget_daily_pct_v2",
        "budget_family_pct_v2",
        "is_smart_mode_v1",
        "smart_allocation_config_v1",
        "saved_income_sources_v1",
        "saved_companies_v1",
        "active_career_profile_v1",
        "saved_career_profiles_v1",
        "cached_logged_cutoffs_v1",
        "offline_sync_queue",
      ];
      alloLocalStorageKeys.forEach((key) => localStorage.removeItem(key));
      document.cookie = "app_unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      router.push("/login");
      router.refresh();
    } catch {
      setDeleteAccountError("Network error. Please check your connection and try again.");
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-on-background pb-28 px-4 pt-6 md:max-w-md md:mx-auto md:border-x border-outline-variant">
        {/* Top bar skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Welcome skeleton */}
        <div className="mb-6">
          <Skeleton className="h-3.5 w-16 mb-2" />
          <Skeleton className="h-6 w-44" />
        </div>

        {/* Menu list skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-col gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>

        {/* Logout button skeleton */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </main>
    );
  }

  const fullName = user?.user_metadata?.full_name || "User";
  const email = user?.email || "";

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-slate-800 pb-28 px-4 pt-6 md:max-w-md md:mx-auto md:border-x border-slate-200">
      {/* Top Header Bar */}
      <header className="mb-6 px-1">
        <h1 className="text-base font-bold text-slate-800">Profile</h1>
      </header>

      {/* Greeting Section (Clean, no avatar) */}
      <div className="mb-6 px-1 animate-fade-in-up">
        <p className="text-xs text-slate-500 font-medium">Welcome,</p>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">{fullName}</h2>
      </div>

      {/* Grouped Menu List Card */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden mb-6 animate-fade-in-up-delay-1">
        {/* 1. Personal Information */}
        <button
          type="button"
          onClick={() => setShowPersonalInfoModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-slate-600 text-[20px] shrink-0">person</span>
            <span className="text-sm font-semibold text-slate-800">Personal information</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            <span className="text-xs text-slate-400 truncate max-w-[130px] hidden sm:inline">{email}</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform duration-150">chevron_right</span>
          </div>
        </button>

        {/* 2. Salary Cycle */}
        <button
          type="button"
          onClick={() => setShowSalaryCycleModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-slate-600 text-[20px] shrink-0">calendar_month</span>
            <span className="text-sm font-semibold text-slate-800">Salary cycle</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-slate-500">
              {salaryCycle === "bi-monthly" ? "Bi-Monthly" : "Monthly"}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:translate-x-0.5 transition-transform duration-150">chevron_right</span>
          </div>
        </button>

        {/* 3. Budget Formula */}
        <button
          type="button"
          onClick={() => setShowBudgetFormulaModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-slate-600 text-[20px] shrink-0">tune</span>
            <span className="text-sm font-semibold text-slate-800">Budget formula</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-slate-500">
              {isSmartMode ? "Smart Mode" : `${allocations.length + 1} Categories`}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:translate-x-0.5 transition-transform duration-150">chevron_right</span>
          </div>
        </button>

        {/* 4. Terms and conditions */}
        <Link
          href="/terms"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-slate-600 text-[20px] shrink-0">description</span>
            <span className="text-sm font-semibold text-slate-800">Terms and conditions</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:translate-x-0.5 transition-transform duration-150">chevron_right</span>
        </Link>

        {/* 5. Privacy policy */}
        <Link
          href="/privacy"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-slate-600 text-[20px] shrink-0">shield</span>
            <span className="text-sm font-semibold text-slate-800">Privacy policy</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:translate-x-0.5 transition-transform duration-150">chevron_right</span>
        </Link>
      </section>

      {/* Standalone Logout Button */}
      <section className="mb-6 animate-fade-in-up-delay-2">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-rose-50/60 hover:border-rose-200 text-rose-600 font-semibold text-sm transition-colors duration-150 text-center shadow-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Log out
        </button>
      </section>

      {/* Version Footer */}
      <footer className="text-center text-xs text-slate-400 font-medium">
        Version 0.1.0 (Allo)
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. Personal Information Modal */}
      {showPersonalInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500">Your verified account details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonalInfoModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Full Name</span>
                <span className="text-sm font-bold text-slate-800">{fullName}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
                <span className="text-sm font-medium text-slate-800 break-all">{email || "Not specified"}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Security</span>
                  <span className="text-sm font-medium text-slate-800">Password</span>
                </div>
                <Link
                  href="/update-password"
                  className="text-xs font-bold text-primary hover:underline px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  Change
                </Link>
              </div>

              <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 block">Account Data</span>
                  <span className="text-xs font-medium text-slate-700">Permanently delete account</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonalInfoModal(false);
                    setDeleteConfirmText("");
                    setDeleteAccountError(null);
                    setShowDeleteAccountModal(true);
                  }}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-100/70 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white transition-colors duration-150"
                >
                  Delete account
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPersonalInfoModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Salary Cycle Modal */}
      {showSalaryCycleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Salary Cycle</h3>
                <p className="text-xs text-slate-500">How often you receive pay</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSalaryCycleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors duration-150 ${
                  salaryCycle === "bi-monthly"
                    ? "border-primary bg-primary/[0.03]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => handleSaveCycle("bi-monthly")}
              >
                <input
                  type="radio"
                  name="salaryCycle"
                  checked={salaryCycle === "bi-monthly"}
                  readOnly
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Bi-Monthly</span>
                  <span className="text-xs text-slate-500">Twice a month (e.g., 15th & 30th)</span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors duration-150 ${
                  salaryCycle === "monthly"
                    ? "border-primary bg-primary/[0.03]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => handleSaveCycle("monthly")}
              >
                <input
                  type="radio"
                  name="salaryCycle"
                  checked={salaryCycle === "monthly"}
                  readOnly
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Monthly</span>
                  <span className="text-xs text-slate-500">Once a month</span>
                </div>
              </label>

              {isSavingCycle ? (
                <div className="flex items-center justify-center gap-1.5 py-1 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  Saving preference...
                </div>
              ) : saveCycleSuccess ? (
                <div className="flex items-center justify-center gap-1.5 py-1 text-emerald-700 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Saved successfully!
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSalaryCycleModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Budget Formula Modal */}
      {showBudgetFormulaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Budget Formula</h3>
                <p className="text-xs text-slate-500">Customize salary allocation percentages</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetFormulaModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              {/* Smart Salary Allocation Toggle */}
              <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Smart Salary Allocation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Dynamically adjust percentages based on income size</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isSmartMode}
                    onChange={(e) => setIsSmartMode(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Formula Body */}
              {!isSmartMode ? (
                <div className="flex flex-col gap-3">
                  {allocations.map((alloc) => (
                    <div key={alloc.id} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-500 text-[18px]">{alloc.icon}</span>
                          {editingCategory === alloc.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="text-xs font-bold text-slate-800 border border-slate-300 rounded px-1.5 py-0.5"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (editingName.trim()) {
                                    setAllocations(allocations.map(a => a.id === alloc.id ? { ...a, name: editingName.trim() } : a));
                                  }
                                  setEditingCategory(null);
                                }}
                                className="text-emerald-700 hover:text-emerald-800 text-xs font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-slate-800">{alloc.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{alloc.pct}%</span>
                          {alloc.id !== 'daily' && alloc.id !== 'family' && (
                            <div className="relative">
                              <button
                                onClick={() => setActiveMenu(activeMenu === alloc.id ? null : alloc.id)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                              >
                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                              </button>
                              {activeMenu === alloc.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 w-28">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(alloc.id);
                                      setEditingName(alloc.name);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAllocations(allocations.filter(a => a.id !== alloc.id));
                                      setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={alloc.pct}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAllocations(allocations.map(a => a.id === alloc.id ? { ...a, pct: isNaN(val) ? 0 : val } : a));
                        }}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}

                  {/* Savings Vault Core */}
                  <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock</span>
                      <div>
                        <span className="text-sm font-semibold text-slate-800 block">Savings Vault</span>
                        <span className="text-[10px] text-slate-500">Core balance</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">
                      {100 - allocations.reduce((sum, a) => sum + a.pct, 0)}%
                    </span>
                  </div>

                  {/* Add Custom Category */}
                  {showAddForm ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-slate-600 uppercase">New Category</span>
                      <input
                        type="text"
                        placeholder="Category Name (e.g. Tithes, Investment)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Auto"
                          value={newCatPct}
                          onChange={(e) => setNewCatPct(e.target.value)}
                          className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                        />
                        <span className="text-xs text-slate-500">% (Optional)</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCatName.trim()) return;
                            const colors = ["purple", "pink", "rose", "teal", "indigo", "cyan"];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            const parsedPct = parseInt(newCatPct);
                            const isAuto = isNaN(parsedPct) || parsedPct <= 0;
                            const newAlloc = {
                              id: `custom_${Date.now()}`,
                              name: newCatName.trim(),
                              icon: "category",
                              pct: isAuto ? 10 : parsedPct,
                              color: randomColor
                            };
                            let nextAllocs = [...allocations, newAlloc];
                            if (isAuto) {
                              nextAllocs = handleAutoBalance(nextAllocs);
                            }
                            setAllocations(nextAllocs);
                            setNewCatName("");
                            setNewCatPct("");
                            setShowAddForm(false);
                          }}
                          className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Custom Category
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {smartBrackets.map((bracket) => {
                    const totalPct = bracket.allocations.reduce((sum, a) => sum + a.pct, 0);
                    return (
                      <div key={bracket.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedBracket(expandedBracket === bracket.id ? null : bracket.id)}
                          className="w-full bg-slate-50 px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{bracket.name}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Savings: {100 - totalPct}%
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">
                            {expandedBracket === bracket.id ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                        {expandedBracket === bracket.id && (
                          <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-3">
                            {bracket.allocations.map((alloc) => (
                              <div key={alloc.id} className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600 font-medium">{alloc.name}</span>
                                  <span className="font-bold text-slate-800">{alloc.pct}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={alloc.pct}
                                  disabled
                                  className="w-full accent-primary opacity-70 cursor-not-allowed"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    Smart Brackets dynamically apply these allocations based on your net income in the Dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer with Save Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={handleSaveFormula}
                disabled={isSaving}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 transition-all duration-150 ${
                  isSaving
                    ? "bg-slate-500 cursor-wait"
                    : saveSuccess
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]"
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${isSaving ? "animate-spin" : ""}`}>
                  {isSaving ? "sync" : saveSuccess ? "check_circle" : "save"}
                </span>
                {isSaving ? "Saving..." : saveSuccess ? "Formula Saved!" : "Save Formula"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[28px]">logout</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Log Out</h3>
              <p className="text-slate-500 text-xs mb-6">
                Are you sure you want to log out of your Allo account?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors duration-150"
                >
                  Yes, Log Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete Account</h3>
              <p className="text-slate-500 text-xs text-center mb-4 leading-relaxed">
                This will permanently delete your Allo account, salary logs, and saved preferences. This action cannot be undone.
              </p>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeletingAccount}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-500 transition-colors duration-150"
                />
              </div>

              {deleteAccountError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {deleteAccountError}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-colors duration-150 ${
                    isDeletingAccount || deleteConfirmText !== "DELETE"
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isDeletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
