"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "../../../components/Skeleton";
import { formatInTimeZone } from "date-fns-tz";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      // Fallback to older keys if available
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
    // Simulate network delay for animation effect
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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    // Clear the app_unlocked cookie
    document.cookie = "app_unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-on-background pb-24 px-4 pt-8 md:max-w-md md:mx-auto md:border-x border-outline-variant">
        <header className="mb-8">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-5 w-40" />
        </header>

        <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant mb-6 shadow-sm flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex-1 overflow-hidden flex flex-col gap-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant mb-6 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </section>
      </main>
    );
  }

  const fullName = user?.user_metadata?.full_name || "User";
  const email = user?.email || "";

  return (
    <main className="min-h-screen bg-background text-on-background pb-24 px-4 pt-8 md:max-w-md md:mx-auto md:border-x border-outline-variant">
      <header className="mb-8 animate-fade-in-up">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Settings</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Manage your account</p>
      </header>

      <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant mb-6 shadow-sm flex items-center gap-4 animate-fade-in-up-delay-1">
        <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold font-headline-sm uppercase">
          {fullName.charAt(0)}
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="font-headline-sm text-headline-sm font-bold truncate">{fullName}</h2>
          <p className="text-on-surface-variant font-body-sm truncate">{email}</p>
        </div>
      </section>

      {/* Salary Cycle Setting */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant mb-6 shadow-sm overflow-hidden animate-fade-in-up-delay-1">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Salary Cycle</h3>
          {isSavingCycle ? (
            <span className="text-primary font-bold text-[10px] uppercase animate-pulse">Saving...</span>
          ) : saveCycleSuccess ? (
            <span className="text-secondary font-bold text-[10px] uppercase animate-pulse">Saved!</span>
          ) : null}
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSaveCycle("bi-monthly")}>
            <input type="radio" name="salaryCycle" checked={salaryCycle === "bi-monthly"} readOnly className="w-4 h-4 text-primary focus:ring-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Bi-Monthly</span>
              <span className="text-xs text-slate-500">I get paid twice a month (e.g., 15th & 30th)</span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSaveCycle("monthly")}>
            <input type="radio" name="salaryCycle" checked={salaryCycle === "monthly"} readOnly className="w-4 h-4 text-primary focus:ring-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Monthly</span>
              <span className="text-xs text-slate-500">I get paid once a month</span>
            </div>
          </label>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant mb-6 shadow-sm overflow-hidden animate-fade-in-up-delay-2">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Budget Formula</h3>
          {saveSuccess && <span className="text-secondary font-bold text-[10px] uppercase animate-pulse">Saved!</span>}
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          
          <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Smart Salary Allocation</h4>
              <p className="text-xs text-slate-500 mt-1">Dynamically adjust percentages based on income size.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isSmartMode} onChange={(e) => setIsSmartMode(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {!isSmartMode ? (
            <>
              {allocations.map((alloc, idx) => (
                <div key={alloc.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center relative">
                    {editingCategory === alloc.id ? (
                      <div className="flex items-center gap-2 w-full mr-4">
                        <span className={`material-symbols-outlined text-[16px] text-${alloc.color}-500`}>{alloc.icon}</span>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="border-b-2 border-primary outline-none text-sm font-semibold text-slate-700 bg-transparent flex-1 py-1"
                          autoFocus
                          onBlur={() => {
                            if (editingName.trim()) {
                              const newAllocs = [...allocations];
                              newAllocs[idx].name = editingName.trim();
                              setAllocations(newAllocs);
                            }
                            setEditingCategory(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      </div>
                    ) : (
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <span className={`material-symbols-outlined text-[16px] text-${alloc.color}-500`}>{alloc.icon}</span>
                        {alloc.name}
                      </label>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold text-${alloc.color}-600 w-8 text-right`}>{alloc.pct}%</span>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === alloc.id ? null : alloc.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                          title="Options"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        
                        {activeMenu === alloc.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 w-32">
                            <button 
                              onClick={() => {
                                setEditingCategory(alloc.id);
                                setEditingName(alloc.name);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              Rename
                            </button>
                            {alloc.id !== 'daily' && alloc.id !== 'family' && (
                              <button 
                                onClick={() => {
                                  setAllocations(allocations.filter(a => a.id !== alloc.id));
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={alloc.pct} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const newAllocs = [...allocations];
                      newAllocs[idx].pct = val;
                      setAllocations(newAllocs);
                    }}
                    className={`w-full accent-${alloc.color}-500`}
                  />
                </div>
              ))}

              <div className={`flex justify-between items-center py-3 pl-4 pr-1 rounded-lg border mt-2 mb-2 ${allocations.reduce((sum, a) => sum + a.pct, 0) > 100 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-100'}`}>
                <span className={`text-sm font-semibold flex items-center gap-1 ${allocations.reduce((sum, a) => sum + a.pct, 0) > 100 ? 'text-red-700' : 'text-green-700'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {allocations.reduce((sum, a) => sum + a.pct, 0) > 100 ? 'warning' : 'savings'}
                  </span>
                  {allocations.reduce((sum, a) => sum + a.pct, 0) > 100 ? 'Over Allocated!' : 'Savings'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold w-8 text-right ${allocations.reduce((sum, a) => sum + a.pct, 0) > 100 ? 'text-red-700' : 'text-green-700'}`}>
                    {100 - allocations.reduce((sum, a) => sum + a.pct, 0)}%
                  </span>
                  <div className="relative">
                    <button 
                      onClick={() => alert("The Savings category is the core of the System's Vault. It cannot be modified.")}
                      className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                      title="System Core"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>

              {showAddForm ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Add Custom Category</h4>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Category Name (e.g. Tithes, Investment)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" max="100"
                        placeholder="Auto"
                        value={newCatPct}
                        onChange={(e) => setNewCatPct(e.target.value)}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary placeholder-slate-400"
                      />
                      <span className="text-sm font-semibold text-slate-600">% (Optional)</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => {
                          if (!newCatName.trim()) return;
                          const colors = ["purple", "pink", "rose", "teal", "indigo", "cyan"];
                          const randomColor = colors[allocations.length % colors.length];
                          
                          const parsedPct = parseInt(newCatPct);
                          const isAuto = isNaN(parsedPct) || parsedPct <= 0;

                          const newAlloc = {
                            id: `custom_${Date.now()}`,
                            name: newCatName,
                            icon: "folder_special",
                            pct: isAuto ? 0 : parsedPct,
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
                        className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold"
                      >
                        Add
                      </button>
                      <button 
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400 transition-all font-semibold text-sm mb-4"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Allocation Category
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {smartBrackets.map((bracket, bIdx) => {
                const totalPct = bracket.allocations.reduce((sum, a) => sum + a.pct, 0);
                const isOver = totalPct > 100;
                
                return (
                  <div key={bracket.id} className="border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setExpandedBracket(expandedBracket === bracket.id ? null : bracket.id)}
                      className="w-full bg-surface-container-low px-4 py-3 flex items-center justify-between text-left hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{bracket.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isOver ? (
                            <span className="text-error font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">warning</span> Over Allocated!
                            </span>
                          ) : (
                            <span className="text-green-600 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">savings</span> Savings: {100 - totalPct}%
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${expandedBracket === bracket.id ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    
                    {expandedBracket === bracket.id && (
                      <div className="p-4 bg-white border-t border-outline-variant/50 flex flex-col gap-4">
                        {bracket.allocations.map((alloc, aIdx) => (
                          <div key={alloc.id} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                <span className={`material-symbols-outlined text-[16px] text-${alloc.color}-500`}>{alloc.icon}</span>
                                {alloc.name}
                              </label>
                              <span className={`text-sm font-bold text-${alloc.color}-600`}>{alloc.pct}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" max="100" 
                              value={alloc.pct} 
                              disabled
                              className={`w-full accent-${alloc.color}-500 opacity-80 cursor-not-allowed`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-slate-500 italic mt-2">
                *Smart Brackets dynamically apply these allocations based on your inputted net income in the Dashboard. The percentages are managed by the System Vault and cannot be modified.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={handleSaveFormula}
              disabled={isSaving}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
                isSaving ? 'bg-slate-500 text-white cursor-wait scale-[0.98]' :
                saveSuccess ? 'bg-emerald-600 text-white' :
                'bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.98]'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isSaving ? 'animate-spin' : saveSuccess ? 'animate-bounce' : ''}`}>
                {isSaving ? 'sync' : saveSuccess ? 'check_circle' : 'save'}
              </span>
              {isSaving ? "Saving..." : saveSuccess ? "Formula Saved!" : "Save Formula"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Account</h3>
        </div>
        <button 
          onClick={handleLogoutClick}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-error-container/20 transition-colors text-left active:bg-error-container/30 text-error"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
            <span className="font-body-lg font-bold">Log Out</span>
          </div>
        </button>
      </section>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-outline-variant/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-error-container/20 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">logout</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-2">Log Out</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmLogout}
                  className="w-full py-3.5 bg-error text-on-error rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Yes, Log Out
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-3.5 bg-surface-container-high text-on-surface rounded-xl font-bold transition-colors hover:bg-surface-container-highest active:scale-95"
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
