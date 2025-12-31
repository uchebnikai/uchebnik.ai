import React, { useEffect, useState, useRef } from 'react';
import { UserPlan } from '../../types';
import { Info, X } from 'lucide-react';

interface AdSenseContainerProps {
  userPlan: UserPlan;
}

export const AdSenseContainer = ({ userPlan }: AdSenseContainerProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants - Actual AdSense values for uchebnikai.com provided by user
  const AD_CLIENT = "ca-pub-7792843462232007"; 
  const AD_SLOT = "5047466989"; 

  useEffect(() => {
    // Breakpoint detection to avoid rendering hidden elements that cause AdSense "width=0" errors
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    // Only run for users on the free plan
    if (userPlan !== 'free' || !isVisible) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const initAd = () => {
      // Ensure the container exists and has width before pushing
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        try {
          if (typeof window !== 'undefined') {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            setAdLoaded(true);
          }
        } catch (e) {
          console.error("AdSense push error:", e);
        }
      } else {
        // If not ready yet, retry in a bit
        timeoutId = setTimeout(initAd, 500);
      }
    };

    timeoutId = setTimeout(initAd, 1000);

    return () => clearTimeout(timeoutId);
  }, [userPlan, isVisible, isMobile]); // Re-init if mode changes

  if (userPlan !== 'free' || !isVisible) return null;

  return (
    <>
      {/* DESKTOP PLACEMENT: Bottom Right Floating */}
      {!isMobile && (
        <div className="fixed bottom-4 right-4 z-[45] w-[300px] animate-in slide-in-from-right duration-700">
          <div className="glass-panel p-2 pb-1 overflow-hidden shadow-2xl border-indigo-500/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Info size={10} /> Advertisement
              </span>
              <button 
                  onClick={() => setIsVisible(false)}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                  title="Close ad"
              >
                  <X size={10} />
              </button>
            </div>
            
            <div ref={containerRef} className="bg-white/5 rounded-2xl overflow-hidden min-h-[250px] flex items-center justify-center text-zinc-500 text-xs italic border border-white/5">
              {/* AdSense Unit: Desktop Responsive */}
              <ins className="adsbygoogle"
                   style={{ display: 'block', width: '100%', height: '250px' }}
                   data-ad-client={AD_CLIENT}
                   data-ad-slot={AD_SLOT}
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
              {!adLoaded && <span className="animate-pulse">Loading Sponsor...</span>}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PLACEMENT: Top Docked (Below Header) */}
      {isMobile && (
        <div className="w-full px-2 mt-2 z-20 animate-in slide-in-from-top duration-500">
          <div className="glass-panel p-1.5 overflow-hidden border-indigo-500/10 bg-white/20 dark:bg-black/20 backdrop-blur-md">
              <div className="flex justify-between items-center px-2 mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-tighter text-zinc-500">Sponsored</span>
                  <button onClick={() => setIsVisible(false)} className="text-zinc-500"><X size={8}/></button>
              </div>
              <div ref={containerRef} className="bg-white/5 rounded-xl overflow-hidden min-h-[50px] flex items-center justify-center text-[10px] text-zinc-500 italic border border-white/5">
                  {/* AdSense Unit: Mobile Responsive */}
                  <ins className="adsbygoogle"
                       style={{ display: 'block', width: '100%', height: '50px' }}
                       data-ad-client={AD_CLIENT}
                       data-ad-slot={AD_SLOT}
                       data-ad-format="auto"
                       data-full-width-responsive="true"></ins>
                  {!adLoaded && <span>Sponsor Space</span>}
              </div>
          </div>
        </div>
      )}
    </>
  );
};