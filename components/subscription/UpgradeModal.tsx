
import React, { useState } from 'react';
import { X, ArrowLeft, Zap, Crown, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserPlan } from '../../types';
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
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full max-w-sm p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
                    <button onClick={() => {setTargetPlan(null);}} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                    <button onClick={() => setTargetPlan(null)} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"><ArrowLeft size={14}/> Назад</button>
                    <div className="flex flex-col items-center gap-4 text-center mt-4">
                        <div className={`p-4 rounded-2xl text-white shadow-xl ${targetPlan === 'plus' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'}`}>
                            {targetPlan === 'plus' ? <Zap size={32} fill="currentColor"/> : <Crown size={32} fill="currentColor"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Ръчно активиране</h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Въведете промо код за {targetPlan === 'plus' ? 'Plus' : 'Pro'}.</p>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={unlockKeyInput}
                        onChange={e => setUnlockKeyInput(e.target.value)}
                        placeholder="Въведете код"
                        className="w-full bg-gray-100 dark:bg-black/50 p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider"
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
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
        <div className="w-full max-w-5xl space-y-8 animate-in zoom-in-95 duration-300">
           <div className="flex justify-end">
             <button onClick={() => setShowUnlockModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24}/></button>
           </div>
           
           <div className="text-center space-y-4 mb-8">
               <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Избери своя план</h2>
               <p className="text-lg text-gray-400">Отключете пълния потенциал на Uchebnik AI</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Free Plan */}
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-gray-200 dark:border-white/5 flex flex-col relative overflow-hidden">
                 <div className="mb-6">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free Plan</div>
                    <div className="text-3xl font-black">0 лв.<span className="text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> 4 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Gemini 2.5 Flash</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Основни функции</div>
                 </div>
                 <button 
                    disabled={userPlan === 'free'} 
                    onClick={() => {
                        if(userPlan !== 'free') handleManageSubscription();
                    }}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${userPlan === 'free' ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                 >
                    {userPlan === 'free' ? 'Текущ план' : 'Управление'}
                 </button>
              </div>

              {/* Plus Plan */}
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-500/10 scale-105 z-10">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={16}/> Plus Plan</div>
                    <div className="text-3xl font-black">13 лв.<span className="text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> 12 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> Gemini 3 Flash</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> Персонализация</div>
                 </div>
                 <button 
                    onClick={() => userPlan === 'plus' ? handleManageSubscription() : handleCheckout('plus')} 
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${userPlan === 'plus' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'}`}
                 >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (userPlan === 'plus' ? 'Управление' : 'Избери Plus')}
                 </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-amber-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-amber-500/10">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={16}/> Pro Plan</div>
                    <div className="text-3xl font-black">23 лв.<span className="text-lg font-medium text-gray-500"> / месец</span></div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Неограничени изображения</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Gemini 3 Flash</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Всички екстри</div>
                 </div>
                 <button 
                    onClick={() => userPlan === 'pro' ? handleManageSubscription() : handleCheckout('pro')}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${userPlan === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-orange-500/25'}`}
                 >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (userPlan === 'pro' ? 'Управление' : 'Избери Pro')}
                 </button>
              </div>
           </div>

           {/* Manual Code Link */}
           <div className="text-center pt-4">
               <button onClick={() => setTargetPlan('pro')} className="text-sm text-gray-500 hover:text-white transition-colors underline decoration-dotted">
                   Имате промо код? Въведете го тук.
               </button>
           </div>
        </div>
      </div>
    );
};
