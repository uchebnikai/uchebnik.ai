
import React, { useState } from 'react';
import { X, ArrowLeft, Zap, Crown, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserPlan } from '../../types';
import { supabase } from '../../supabaseClient';

interface UpgradeModalProps {
  showUnlockModal: boolean;
  setShowUnlockModal: (val: boolean) => void;
  targetPlan: UserPlan | null;
  setTargetPlan: (val: UserPlan | null) => void;
  unlockKeyInput: string;
  setUnlockKeyInput: (val: string) => void;
  handleUnlockSubmit: () => void;
  userPlan: UserPlan;
  session: any;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STRIPE_PRICES = {
  free: 'price_1SfPSOE0C0vexh9CQmjhJYYX',
  plus: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  pro: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const UpgradeModal = ({
  showUnlockModal,
  setShowUnlockModal,
  targetPlan,
  setTargetPlan,
  unlockKeyInput,
  setUnlockKeyInput,
  handleUnlockSubmit,
  userPlan,
  session,
  addToast
}: UpgradeModalProps) => {
    const [loadingPlan, setLoadingPlan] = useState<UserPlan | null>(null);
    const [isPromoMode, setIsPromoMode] = useState(false);
    
    if (!showUnlockModal) return null;

    const handleStripeCheckout = async (plan: UserPlan) => {
        if (!session) {
            addToast("Моля, влезте в акаунта си, за да продължите с плащането.", "info");
            return;
        }

        if (plan === 'free' || plan === userPlan) return;

        setLoadingPlan(plan);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { 
                    priceId: STRIPE_PRICES[plan],
                    userId: session.user.id,
                    userEmail: session.user.email,
                    planName: plan
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Не бе получен линк за плащане.");
            }
        } catch (err: any) {
            console.error("Stripe Checkout Error:", err);
            addToast(err.message || "Грешка при свързване със Stripe. Опитайте пак.", "error");
        } finally {
            setLoadingPlan(null);
        }
    };

    // Promo Code View
    if (isPromoMode) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 md:p-8 rounded-[32px] border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300 my-auto">
                    <button onClick={() => setIsPromoMode(false)} className="absolute top-4 left-4 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-xs font-bold">
                        <ArrowLeft size={14}/> Назад
                    </button>
                    
                    <div className="flex flex-col items-center gap-4 text-center mt-6">
                        <div className="p-4 rounded-2xl bg-indigo-500 text-white shadow-xl">
                            <Zap size={32} fill="currentColor"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight dark:text-white">Активирай с код</h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Въведете вашия промо код за достъп.</p>
                        </div>
                    </div>
                    
                    <input
                        type="text"
                        value={unlockKeyInput}
                        onChange={e => setUnlockKeyInput(e.target.value)}
                        placeholder="UCH-XXXX-XXXX"
                        className="w-full bg-gray-100 dark:bg-black/50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider transition-all dark:text-white"
                        autoFocus
                    />
                    
                    <Button onClick={handleUnlockSubmit} className="w-full py-4 text-base shadow-lg border-none bg-indigo-600 hover:bg-indigo-500">
                        Активирай Сега
                    </Button>
                </div>
            </div>
        );
    }

    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div className="sticky top-0 inset-x-0 p-4 flex justify-end z-50 pointer-events-none">
            <button 
                onClick={() => setShowUnlockModal(false)} 
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto shadow-lg"
            >
                <X size={24}/>
            </button>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 pb-20 pt-4 flex flex-col items-center">
           <div className="text-center space-y-4 mb-10">
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Избери своя план</h2>
               <p className="text-lg md:text-xl text-gray-400 font-medium max-w-lg mx-auto">Отключете пълния потенциал на Uchebnik AI чрез Stripe</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
              {/* Free Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[32px] p-8 border border-gray-200 dark:border-white/5 flex flex-col relative overflow-hidden">
                 <div className="mb-6">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free Plan</div>
                    <div className="text-3xl font-black dark:text-white">Безплатен</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> 4 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Gemma 3 (4B)</div>
                 </div>
                 <button disabled className="w-full py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default">
                    {userPlan === 'free' ? 'Текущ план' : 'Стандартен'}
                 </button>
              </div>

              {/* Plus Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[32px] p-8 border-2 border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-500/10 scale-100 md:scale-105 z-10">
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={16} fill="currentColor"/> Plus Plan</div>
                    <div className="text-3xl font-black dark:text-white">Plus</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> 12 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> Gemma 3 (12B)</div>
                 </div>
                 <button 
                    onClick={() => handleStripeCheckout('plus')} 
                    disabled={userPlan === 'plus' || !!loadingPlan}
                    className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${userPlan === 'plus' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'}`}
                 >
                    {loadingPlan === 'plus' ? <Loader2 className="animate-spin" size={20}/> : userPlan === 'plus' ? 'Текущ план' : 'Абонирай се с Plus'}
                 </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[32px] p-8 border border-amber-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-amber-500/10">
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={16} fill="currentColor"/> Pro Plan</div>
                    <div className="text-3xl font-black dark:text-white">Pro</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Неограничени изображения</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Gemma 3 (27B)</div>
                 </div>
                 <button 
                    onClick={() => handleStripeCheckout('pro')}
                    disabled={userPlan === 'pro' || !!loadingPlan} 
                    className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${userPlan === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-orange-500/25'}`}
                 >
                    {loadingPlan === 'pro' ? <Loader2 className="animate-spin" size={20}/> : userPlan === 'pro' ? 'Текущ план' : 'Абонирай се с Pro'}
                 </button>
              </div>
           </div>
           
           <button 
             onClick={() => setIsPromoMode(true)}
             className="mt-8 text-gray-500 hover:text-indigo-500 text-sm font-bold transition-colors flex items-center gap-2"
           >
              Имаш промо код? Кликни тук
           </button>

           <div className="mt-6 flex items-center gap-4 opacity-40 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
              <div className="h-4 w-px bg-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Payments</span>
           </div>
        </div>
      </div>
    );
};
