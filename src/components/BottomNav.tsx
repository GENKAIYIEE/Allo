"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isHistory = pathname === "/history";
  const isSettings = pathname === "/settings";

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center bg-white py-2 pb-safe border-t border-slate-200 md:max-w-md md:left-1/2 md:-translate-x-1/2 md:border-x shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link 
        href="/dashboard" 
        className={`flex flex-col items-center justify-center px-4 py-1 rounded-lg transition-all duration-200 ${
          isDashboard 
            ? "text-[#001142]" 
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isDashboard ? "'FILL' 1" : "'FILL' 0" }}>account_balance</span>
        <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
      </Link>

      <Link 
        href="/history" 
        className={`flex flex-col items-center justify-center px-4 py-1 rounded-lg transition-all duration-200 ${
          isHistory 
            ? "text-[#001142]" 
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isHistory ? "'FILL' 1" : "'FILL' 0" }}>history</span>
        <span className="font-label-caps text-label-caps mt-1">History</span>
      </Link>



      <Link 
        href="/settings" 
        className={`flex flex-col items-center justify-center px-4 py-1 rounded-lg transition-all duration-200 ${
          isSettings 
            ? "text-[#001142]" 
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isSettings ? "'FILL' 1" : "'FILL' 0" }}>person</span>
        <span className="font-label-caps text-label-caps mt-1 text-[10px]">Profile</span>
      </Link>
    </nav>
  );
}
