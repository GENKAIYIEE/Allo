"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export function OfflineSyncManager() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial check
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Also attempt sync on initial load if we have pending items
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const syncOfflineData = async () => {
    try {
      const queueRaw = localStorage.getItem("offline_sync_queue");
      if (!queueRaw) return;
      
      const queue = JSON.parse(queueRaw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      setIsSyncing(true);
      setSyncMessage(`Syncing ${queue.length} offline log(s)...`);

      const remainingQueue = [...queue];
      let syncedCount = 0;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        
        // Remove internal fields before sending to Supabase
        const { id, is_pending_sync, ...payload } = item;

        const { error } = await supabase.from("payday_logs").insert(payload);
        
        if (!error) {
          // Remove from local queue
          const idx = remainingQueue.findIndex(q => q.id === item.id);
          if (idx !== -1) {
            remainingQueue.splice(idx, 1);
          }
          syncedCount++;
        } else {
          console.error("Failed to sync item:", error);
        }
      }

      localStorage.setItem("offline_sync_queue", JSON.stringify(remainingQueue));
      
      if (syncedCount > 0) {
        setSyncMessage(`Successfully synced ${syncedCount} log(s)!`);
        // Refresh the page data if needed, or rely on SWR/React Query. 
        // For simplicity, we just notify the user.
        setTimeout(() => setSyncMessage(null), 3000);
      } else {
        setSyncMessage(null);
      }
    } catch (err) {
      console.error("Sync error:", err);
      setSyncMessage("Sync failed. Will try again later.");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Only render if there's a status to show
  if (!isOffline && !isSyncing && !syncMessage) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
      <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-colors ${
        isOffline ? "bg-amber-100 text-amber-800 border border-amber-200" :
        isSyncing ? "bg-blue-100 text-blue-800 border border-blue-200" :
        "bg-emerald-100 text-emerald-800 border border-emerald-200"
      }`}>
        <span className="material-symbols-outlined text-[16px] animate-pulse">
          {isOffline ? "wifi_off" : isSyncing ? "sync" : "cloud_done"}
        </span>
        {isOffline ? "You are offline" : syncMessage}
      </div>
    </div>
  );
}
