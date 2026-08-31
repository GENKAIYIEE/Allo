"use client";

import { useEffect, useState } from "react";

export default function PwaUpdater() {
  const [showReload, setShowReload] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // Check if there is already a waiting worker
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowReload(true);
        }

        // Listen for new updates found
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // There is a new worker ready, and there's an existing controller
                setWaitingWorker(newWorker);
                setShowReload(true);
              }
            });
          }
        });
      });

      // Reload window when the new worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      setIsUpdating(true);
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      
      // Fallback reload just in case the SW doesn't fire controllerchange
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-96 z-[9999] bg-[#001142] text-white p-4 rounded-3xl shadow-2xl animate-fade-in-up flex items-center justify-between border border-white/10">
      <div className="flex flex-col">
        <span className="font-semibold tracking-tight">Update Available</span>
        <span className="text-sm text-slate-300">A new version is ready.</span>
      </div>
      <button 
        onClick={handleUpdate}
        disabled={isUpdating}
        className="bg-primary text-white px-5 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-80 active:scale-95"
      >
        {isUpdating ? (
          <>
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Updating...
          </>
        ) : (
          "Tap to Update"
        )}
      </button>
    </div>
  );
}
