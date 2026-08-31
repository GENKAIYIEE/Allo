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

  const defaultAllocations: Allocation[] = [
    { id: "daily", name: "Daily Expenses", icon: "list_alt", pct: 40, color: "blue" },
    { id: "family", name: "Family Support", icon: "group", pct: 35, color: "orange" }
  ];

  const [allocations, setAllocations] = useState<Allocation[]>(defaultAllocations);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPct, setNewCatPct] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
  }, [supabase.auth]);

  const handleSaveFormula = () => {
    const total = allocations.reduce((sum, a) => sum + a.pct, 0);
    if (total > 100) {
      alert("Your total allocations exceed 100%. Please reduce a category or use Auto-Balance.");
      return;
    }
    localStorage.setItem("custom_allocations_v1", JSON.stringify(allocations));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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

  const handleLogout = async () => {
    // Clear the app_unlocked cookie
    document.cookie = "app_unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const [resetting, setResetting] = useState(false);

  const handleResetCycle = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to reset the current month's cycle? This will delete all payday logs for this month and let you test the dashboard again.")) return;
    
    setResetting(true);
    try {
      const yearMonth = formatInTimeZone(new Date(), "Asia/Manila", "yyyy-MM");
      const startOfMonthIso = `${yearMonth}-01T00:00:00+08:00`;

      const { error } = await supabase
        .from("payday_logs")
        .delete()
        .eq("user_id", user.id)
        .gte("created_at", startOfMonthIso);
        
      if (error) throw error;
      alert("Cycle reset successfully! You can now log paydays for this month again.");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Failed to reset cycle.");
    } finally {
      setResetting(false);
    }
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


      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant mb-6 shadow-sm overflow-hidden animate-fade-in-up-delay-2">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Budget Formula</h3>
          {saveSuccess && <span className="text-secondary font-bold text-[10px] uppercase animate-pulse">Saved!</span>}
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          
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

          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={handleSaveFormula}
              className="w-full py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Formula
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Developer / Testing</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-on-surface-variant mb-4">
            If you are locked out of the dashboard because you have already logged all paydays for this month, you can reset the cycle to test the dashboard again.
          </p>
          <button 
            onClick={handleResetCycle}
            disabled={resetting}
            className={`w-full py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${resetting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-secondary text-on-secondary hover:bg-secondary-fixed'}`}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {resetting ? "Resetting..." : "Reset Current Month Cycle"}
          </button>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/30">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Account</h3>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-error-container/20 transition-colors text-left active:bg-error-container/30 text-error"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
            <span className="font-body-lg font-bold">Log Out</span>
          </div>
        </button>
      </section>
    </main>
  );
}
