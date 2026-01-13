
import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialFingerprint = useRef<string | null>(null);

  const getFingerprint = async (): Promise<string | null> => {
    try {
      // Fetch index.html with cache-busting
      const response = await fetch(`/?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return null;
      const text = await response.text();
      
      // We look for script/link hashes which change on every build.
      // Taking a slice of the first 10k chars is enough to see asset hash changes.
      return text.substring(0, 10000);
    } catch (e) {
      console.error("[Update Check] Failed to fetch root:", e);
      return null;
    }
  };

  useEffect(() => {
    // 1. Capture initial state
    getFingerprint().then(fp => {
      initialFingerprint.current = fp;
    });

    // 2. Set up interval (60 seconds)
    const interval = setInterval(async () => {
      if (updateAvailable) return; // Don't keep checking if we already know

      const currentFingerprint = await getFingerprint();
      
      if (currentFingerprint && initialFingerprint.current && currentFingerprint !== initialFingerprint.current) {
        console.log("[Update Check] New deployment detected!");
        setUpdateAvailable(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-500 pointer-events-none px-4 w-full max-w-xs md:max-w-sm">
      <button 
        onClick={() => window.location.reload()}
        className="pointer-events-auto w-full flex items-center justify-between gap-4 bg-indigo-600 dark:bg-indigo-500 text-white p-1.5 pl-5 pr-2 rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.4)] border border-white/20 backdrop-blur-xl group hover:bg-indigo-500 transition-all active:scale-95"
      >
        <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-200 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                Налична е нова версия
            </span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full group-hover:bg-white/20 transition-colors">
            <span className="text-xs font-bold">Обнови</span>
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
        </div>
      </button>
    </div>
  );
};
