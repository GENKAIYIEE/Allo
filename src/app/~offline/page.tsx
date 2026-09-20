"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 md:max-w-md md:mx-auto md:border-x border-outline-variant">
      <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in-up">
        {/* Offline Icon Illustration */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 bg-error-container/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-error-container/40 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[64px] text-error">wifi_off</span>
          </div>
          {/* Subtle decorative elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-error-container rounded-full animate-bounce delay-100"></div>
          <div className="absolute bottom-4 -left-4 w-4 h-4 bg-error-container rounded-full animate-bounce delay-300"></div>
        </div>

        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-3">
          No Connection
        </h1>
        
        <p className="font-body-md text-on-surface-variant mb-8 px-4">
          It looks like you're offline. Please check your internet connection to access Allo's full features. 
          Don't worry, your local budget data is safe!
        </p>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Try Again
          </button>
          
          <Link 
            href="/"
            className="w-full py-4 bg-surface-container-high text-on-surface rounded-xl font-bold transition-colors hover:bg-surface-container-highest active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">home</span>
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
