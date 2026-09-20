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
      const minDisplayTime = 2700; // 2700ms minimum splash to let the user read the tagline
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
    <div className={`relative min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Background Shapes (SVG for perfect responsiveness) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice" className="absolute top-0 left-0 w-full h-full">
          <defs>
            <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C469B" />
              <stop offset="100%" stopColor="#3A7DF1" />
            </linearGradient>
            <linearGradient id="gradBot" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1C469B" />
              <stop offset="100%" stopColor="#3A7DF1" />
            </linearGradient>
          </defs>

          {/* Top Left */}
          <polygon points="0,0 1000,0 0,800" fill="#D4E5FA" opacity="0.6" />
          <polygon points="0,0 750,0 0,600" fill="url(#gradTop)" opacity="0.9" />
          <polygon points="0,0 500,0 0,400" fill="#001A4B" />

          {/* Bottom Right */}
          <polygon points="1440,1024 565,1024 1440,324" fill="url(#gradBot)" opacity="0.9" />
          <polygon points="1440,1024 940,1024 1440,624" fill="#001A4B" />
        </svg>


      </div>
      
      {/* Main Content */}
      <div className="z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-6">
          <Image 
            src="/allo_logo_v4.png" 
            alt="Allo Logo" 
            fill
            className="animate-splash-logo rounded-2xl md:rounded-[32px] shadow-2xl object-cover"
            priority
          />
        </div>
        <h1 className="animate-splash-text text-4xl md:text-5xl font-extrabold text-[#001A4B] tracking-[0.3em] ml-[0.3em] mb-2 uppercase">Allo</h1>
        <p className="animate-splash-text text-slate-500 text-sm md:text-base font-medium tracking-wide text-center max-w-xs md:max-w-md">Where every peso finds its purpose.</p>
      </div>
    </div>
  );
}
