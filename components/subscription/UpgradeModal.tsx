
import React, { useState } from 'react';
import { X, ArrowLeft, Zap, Crown, CheckCircle, Loader2, ArrowUp, Layers, Star, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserPlan, UserSettings } from '../../types';
import { supabase } from '../../supabaseClient';
import { STRIPE_PRICES } from '../../constants';

interface UpgradeModalProps {
  showUnlockModal: boolean;
  setShowUnlockModal: (val: boolean) => void;
  targetPlan: UserPlan | null;
  setTargetPlan: (val: UserPlan | null) => void;
  unlockKeyInput: string;
  setUnlockKeyInput: (val: string) => void;
  handleUnlockSubmit: () => void;
  userPlan: UserPlan;
  userSettings: UserSettings;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UpgradeModal = ({
  showUnlockModal,
  setShowUnlockModal,
  targetPlan,
  setTargetPlan,
  unlockKeyInput,
  setUnlockKeyInput,
  handleUnlockSubmit,
  userPlan,
  userSettings,
  addToast
}: UpgradeModalProps) => {
    
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (plan: 'plus' | 'pro') => {
        setLoading(true);
        try {
            const priceId = plan === 'plus' ? STRIPE_PRICES.PLUS : STRIPE_PRICES.PRO;
            
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { 
                    priceId,
                    returnUrl: window.location.origin 
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error: any) {
            console.error("Checkout error:", error);
            addToast("Възникна грешка при стартиране на плащането.", "error");
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { returnUrl: window.location.origin }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No portal URL returned");
            }
        } catch (error: any) {
            console.error("Portal error:", error);
            addToast("Възникна грешка при отваряне на портала.", "error");
            setLoading(false);
        }
    };

    if (!showUnlockModal) return null;

    // View for manual code entry (Admin/Promotional)
    if (targetPlan) {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in">
                <div className="bg-white/80 dark:bg-black/60 backdrop-blur-2xl w-full max-w-sm p-8 rounded-[32px] border border-white/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
                    <button onClick={() => {setTargetPlan(null);}} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                    <button onClick={() => setTargetPlan(null)} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"><ArrowLeft size={14}/> Назад</button>
                    <div className="flex flex-col items-center gap-4 text-center mt-4">
                        <div className={`p-4 rounded-2xl text-white shadow-xl ${targetPlan === 'plus' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'}`}>
                            {targetPlan === 'plus' ? <Zap size={32} fill="currentColor"/> : <Crown size={32} fill="currentColor"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Ръчно активиране</h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Въведете промо код за {targetPlan === 'plus' ? 'Plus' : 'Pro'}.</p>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={unlockKeyInput}
                        onChange={e => setUnlockKeyInput(e.target.value)}
                        placeholder="Въведете код"
                        className="w-full bg-gray-50/50 dark:bg-black/40 p-4 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 text-center font-bold text-lg tracking-wider text-zinc-900 dark:text-white"
                        autoFocus
                    />
                    <Button onClick={handleUnlockSubmit} className={`w-full py-4 text-base shadow-lg border-none ${targetPlan === 'plus' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-orange-500/25'}`}>
                        Активирай
                    </Button>
                </div>
            </div>
        );
    }

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in overflow-y-auto">
        <div className="w-full max-w-6xl space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300 my-auto">
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="space-y-1 md:space-y-2">
                   <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg font-display">Избери своя план</h2>
                   <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:items-center">
                        <p className="text-sm md:text-lg text-white/70 font-medium">Инвестирай в успеха си с Uchebnik AI</p>
                        {userSettings.proExpiresAt && (
                            <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full backdrop-blur-sm">
                                <p className="text-xs text-amber-300 font-bold tracking-wide">
                                    Активен Pro до: {new Date(userSettings.proExpiresAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                   </div>
               </div>
               <button onClick={() => setShowUnlockModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md border border-white/10 absolute top-4 right-4 md:static"><X size={24}/></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch mt-2 md:mt-4 pb-8 md:pb-0">
              
              {/* Free Plan */}
              <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-3xl md:rounded-[32px] p-6 md:p-8 border border-white/20 dark:border-white/10 flex flex-col relative overflow-hidden group hover:border-white/30 transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2">
                 <div className="mb-4 md:mb-6">
                    <div className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center"><Star size={12}/></div>
                        Начало
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">0 €<span className="text-sm md:text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 <div className="space-y-3 md:space-y-4 flex-1 mb-6 md:mb-8">
                    <div className="flex items-start gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <CheckCircle size={18} className="text-gray-400 shrink-0 mt-0.5"/> 
                        <span>4 снимки дневно</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <CheckCircle size={18} className="text-gray-400 shrink-0 mt-0.5"/> 
                        <span>Стандартен AI интелект</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-gray-600 dark:text-gray-400 opacity-60">
                        <XCircle size={18} className="text-gray-400 shrink-0 mt-0.5"/> 
                        <span>Гласов режим (Разговори)</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <CheckCircle size={18} className="text-gray-400 shrink-0 mt-0.5"/> 
                        <span>Всички предмети</span>
                    </div>
                 </div>
                 <button 
                    disabled={userPlan === 'free'} 
                    onClick={() => {
                        if(userPlan !== 'free') handleManageSubscription();
                    }}
                    className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all ${userPlan === 'free' ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default' : 'bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-zinc-900 dark:text-white border border-gray-200 dark:border-white/5'}`}
                 >
                    {userPlan === 'free' ? 'Текущ план' : 'Управление'}
                 </button>
              </div>

              {/* Plus Plan - Highlighted */}
              <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl md:rounded-[32px] p-6 md:p-8 border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-500/10 z-10 ring-1 ring-indigo-500/20 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300">
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"/>
                 <div className="mb-4 md:mb-6">
                    <div className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center"><Zap size={12} fill="currentColor"/></div>
                        Най-популярен
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">6.99 €<span className="text-sm md:text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 <div className="space-y-3 md:space-y-4 flex-1 mb-6 md:mb-8">
                    {/* Upgrade Logic: Shows "Everything from Free" as a stack */}
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 pb-3 border-b border-gray-100 dark:border-white/5">
                        <div className="p-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-500">
                            <Layers size={14} />
                        </div>
                        <span>Всичко от Free плана</span>
                    </div>
                    
                    <div className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-white">
                        <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-0.5"/> 
                        <span>12 снимки дневно</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-white">
                        <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-0.5"/> 
                        <span>Гласов режим (Разговори)</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-white">
                        <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-0.5"/> 
                        <span>По-умен AI (Advanced)</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-white">
                        <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-0.5"/> 
                        <span>Търсене в Google</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-white">
                        <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-0.5"/> 
                        <span>Персонализация (Теми)</span>
                    </div>
                 </div>
                 <button 
                    onClick={() => userPlan === 'plus' ? handleManageSubscription() : handleCheckout('plus')} 
                    disabled={loading}
                    className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${userPlan === 'plus' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'}`}
                 >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (userPlan === 'plus' ? 'Управление' : 'Избери Plus')}
                 </button>
              </div>

              {/* Pro Plan - Ultimate */}
              <div className="bg-white/95 dark:bg-[#0f0f11]/90 backdrop-blur-2xl rounded-3xl md:rounded-[32px] p-6 md:p-8 border border-amber-500/50 flex flex-col relative overflow-hidden shadow-2xl shadow-amber-500/20 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 z-20">
                 <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"/>
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"/>
                 
                 <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 blur-3xl rounded-full"/>
                    <div className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center"><Crown size={12} fill="currentColor"/></div>
                        За Отличници
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white">11.99 €<span className="text-sm md:text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 
                 <div className="space-y-3 md:space-y-4 flex-1 mb-6 md:mb-8 relative">
                    {/* Upgrade Logic: Updated text as requested */}
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 pb-3 border-b border-gray-100 dark:border-white/5">
                        <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                            <ArrowUp size={14} />
                        </div>
                        <span>Всичко от Free и Plus плана</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-100">
                        <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5"/> 
                        <span>Неограничени снимки</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-100">
                        <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5"/> 
                        <span>Най-мощният AI (Ultimate)</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-100">
                        <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5"/> 
                        <span>Персонализирани AI Роли</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-100">
                        <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5"/> 
                        <span>Приоритетна поддръжка</span>
                    </div>
                 </div>
                 <button 
                    onClick={() => userPlan === 'pro' ? handleManageSubscription() : handleCheckout('pro')}
                    disabled={loading}
                    className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group ${userPlan === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-orange-500/25'}`}
                 >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"/>
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (userPlan === 'pro' ? 'Управление' : 'Избери Pro')}
                 </button>
              </div>
           </div>

           {/* Manual Code Link */}
           <div className="text-center pt-2 md:pt-4">
               <button onClick={() => setTargetPlan('pro')} className="text-sm text-white/50 hover:text-white transition-colors underline decoration-dotted">
                   Имате промо код? Въведете го тук.
               </button>
           </div>
        </div>
      </div>
    );
};
