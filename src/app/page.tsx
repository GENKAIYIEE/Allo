"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function performSessionCheck() {
      const startTime = Date.now();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1800; // 1800ms minimum splash to let sequence finish
      const delay = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        if (!isMounted) return;
        setIsFadingOut(true);
        
        // Wait for CSS fade out transition (300ms) before actual route push
        setTimeout(() => {
           if (!isMounted) return;
           if (!session) {
             router.push("/login");
           } else {
             router.push("/dashboard");
           }
        }, 300);
      }, delay);
    }
    
    performSessionCheck();
    
    return () => { isMounted = false; };
  }, []);

  return (
    <div className={`min-h-screen bg-[#001142] flex flex-col items-center justify-center transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center">
        <Image 
          src="/allo_logo_v4.png" 
          alt="Allo Logo" 
          width={128} 
          height={128} 
          className="animate-splash-logo rounded-[32px] mb-6"
          priority
        />
        <h1 className="animate-splash-text text-3xl font-bold text-white uppercase tracking-[0.2em]">Allo</h1>
        <p className="animate-splash-text text-slate-300 mt-2 text-sm tracking-wide text-center max-w-xs">Where every peso finds its purpose.</p>
        
        <div className="animate-splash-dots-container flex gap-2 mt-8 absolute bottom-32">
          <div className="animate-splash-dot w-2 h-2 rounded-full bg-blue-400" style={{ animationDelay: "0ms" }}></div>
          <div className="animate-splash-dot w-2 h-2 rounded-full bg-blue-400" style={{ animationDelay: "150ms" }}></div>
          <div className="animate-splash-dot w-2 h-2 rounded-full bg-blue-400" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
