
import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Zap } from 'lucide-react';

export const IosInstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check if the user is on an iOS device
    const isIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
    
    // 2. Check if the app is already running in standalone mode (PWA)
    const isStandalone = (window.navigator as any).standalone === true;

    // 3. Check if the user has previously dismissed the prompt
    const isDismissed = localStorage.getItem('uchebnik_ios_prompt_dismissed') === 'true';

    // Only proceed if it's iOS, not standalone, and not dismissed
    if (isIos && !isStandalone && !isDismissed) {
      // Show the prompt after a delay (e.g., 6 seconds) to ensure the user is engaged
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('uchebnik_ios_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[150] animate-in slide-in-from-bottom-10 fade-in duration-700 pointer-events-none">
      <div className="max-w-md mx-auto bg-[#09090b]/90 backdrop-blur-2xl border border-indigo-500/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto relative overflow-hidden ring-1 ring-white/10">
        {/* Glow Effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 blur-[60px] rounded-full pointer-events-none" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-zinc-500 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex gap-5 items-start">
          <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Smartphone size={28} />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight">
                Инсталирай Uchebnik AI
              </h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed mt-1">
                Добави приложението на началния екран за по-бърз достъп и усещане като истинско приложение.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-indigo-400">1</div>
                    <span>Натисни бутона <span className="inline-flex items-center bg-zinc-800 p-1 rounded mx-0.5"><Share size={12} className="text-blue-400" /></span> в браузъра</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-indigo-400">2</div>
                    <span>Избери <span className="text-white italic">"Add to Home Screen"</span></span>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <Zap size={10} fill="currentColor" />
                Без сваляне от App Store
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
