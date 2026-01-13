
import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Sparkles, X, ArrowRight } from 'lucide-react';

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [visible, setVisible] = useState(false);
  const initialFingerprint = useRef<string | null>(null);

  const getFingerprint = async (): Promise<string | null> => {
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 
          'Pragma': 'no-cache', 
          'Cache-Control': 'no-cache' 
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.buildId ? String(data.buildId) : null;
    } catch (e) {
      console.error("[Update Check] Failed to fetch deployment artifact:", e);
      return null;
    }
  };

  useEffect(() => {
    getFingerprint().then(fp => {
      if (fp) {
        initialFingerprint.current = fp;
      }
    });

    const interval = setInterval(async () => {
      if (updateAvailable) return;

      const currentFingerprint = await getFingerprint();
      
      if (currentFingerprint && initialFingerprint.current && currentFingerprint !== initialFingerprint.current) {
        setUpdateAvailable(true);
        // Slight delay for the animation to feel intentional
        setTimeout(() => setVisible(true), 500);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [updateAvailable]);

  if (!updateAvailable || !visible) return null;

  return (
    <div className="fixed top-20 right-4 lg:top-6 lg:right-6 z-[300] w-full max-w-[340px] pointer-events-none animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="pointer-events-auto group relative overflow-hidden bg-white/80 dark:bg-zinc-950/90 backdrop-blur-2xl border border-indigo-500/30 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 transition-all hover:shadow-indigo-500/10">
        
        {/* Ambient Glow Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 blur-[30px] rounded-full pointer-events-none" />

        <div className="flex gap-4 relative z-10">
          {/* Icon */}
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles size={24} fill="currentColor" className="animate-pulse" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 dark:text-indigo-400">
                Нова версия
              </span>
              <button 
                onClick={() => setVisible(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 -mr-1"
              >
                <X size={14} />
              </button>
            </div>
            
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              Приложението е обновено
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Обнови страницата за най-новите функции и подобрения.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex gap-2 relative z-10">
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
          >
            Обнови сега
            <RefreshCw size={14} className="group-hover/btn:rotate-180 transition-transform duration-700" />
          </button>
          <button 
            onClick={() => setVisible(false)}
            className="px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            По-късно
          </button>
        </div>
      </div>
    </div>
  );
};
