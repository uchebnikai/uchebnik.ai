import React, { useEffect, useState } from 'react';
import { UserPlan } from '../../types';
import { Info, X } from 'lucide-react';

interface AdSenseContainerProps {
  userPlan: UserPlan;
}

export const AdSenseContainer = ({ userPlan }: AdSenseContainerProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Constants - Actual AdSense values for uchebnikai.com
  const AD_CLIENT = "ca-pub-7792843462232007"; 
  const AD_SLOT = "default"; // Will show auto-ads if slot is not specified or use specific unit ID if available

  useEffect(() => {
    // Strict plan check: only run for free users
    if (userPlan !== 'free') return;

    // Inject Google AdSense Script dynamically if not already present
    if (!document.querySelector(`script[src*="${AD_CLIENT}"]`)) {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Trigger the ad push once script is ready
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [userPlan]);

  // If user is not on free plan or manually closed the ad container
  if (userPlan !== 'free' || !isVisible) return null;

  return (
    <>
      {/* DESKTOP PLACEMENT: Bottom Right Floating */}
      <div className="hidden lg:block fixed bottom-4 right-4 z-[45] w-[300px] animate-in slide-in-from-right duration-700">
        <div className="glass-panel p-2 pb-1 overflow-hidden shadow-2xl border-indigo-500/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Info size={10} /> Advertisement
            </span>
            <button 
                onClick={() => setIsVisible(false)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
            >
                <X size={10} />
            </button>
          </div>
          
          <div className="bg-white/5 rounded-2xl overflow-hidden min-h-[250px] flex items-center justify-center text-zinc-500 text-xs italic">
            {/* AdSense Unit */}
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client={AD_CLIENT}
                 data-ad-slot={AD_SLOT === 'default' ? undefined : AD_SLOT}
                 data-ad-format="rectangle"
                 data-full-width-responsive="true"></ins>
            {!adLoaded && <span>Loading premium sponsor...</span>}
          </div>
        </div>
      </div>

      {/* MOBILE PLACEMENT: Top Docked (Below Header) */}
      <div className="lg:hidden w-full px-2 mt-2 z-20 animate-in slide-in-from-top duration-500">
        <div className="glass-panel p-1.5 overflow-hidden border-indigo-500/10 bg-white/20 dark:bg-black/20 backdrop-blur-md">
            <div className="flex justify-center mb-1">
                <span className="text-[8px] font-bold uppercase tracking-tighter text-zinc-500">Sponsored Content</span>
            </div>
            <div className="bg-white/5 rounded-xl overflow-hidden min-h-[50px] flex items-center justify-center text-[10px] text-zinc-500 italic">
                {/* AdSense Unit (Mobile Banner) */}
                <ins className="adsbygoogle"
                     style={{ display: 'inline-block', width: '320px', height: '50px' }}
                     data-ad-client={AD_CLIENT}
                     data-ad-slot={AD_SLOT === 'default' ? undefined : AD_SLOT}></ins>
                {!adLoaded && <span>Sponsor Space</span>}
            </div>
        </div>
      </div>
    </>
  );
};