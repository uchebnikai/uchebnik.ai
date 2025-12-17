
import React from 'react';
import { X, ArrowLeft, Zap, Crown, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserPlan } from '../../types';

interface UpgradeModalProps {
  showUnlockModal: boolean;
  setShowUnlockModal: (val: boolean) => void;
  targetPlan: UserPlan | null;
  setTargetPlan: (val: UserPlan | null) => void;
  unlockKeyInput: string;
  setUnlockKeyInput: (val: string) => void;
  handleUnlockSubmit: () => void;
  userPlan: UserPlan;
}

export const UpgradeModal = ({
  showUnlockModal,
  setShowUnlockModal,
  targetPlan,
  setTargetPlan,
  unlockKeyInput,
  setUnlockKeyInput,
  handleUnlockSubmit,
  userPlan
}: UpgradeModalProps) => {
    
    if (!showUnlockModal) return null;

    // View for entering the activation key
    if (targetPlan) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 md:p-8 rounded-[32px] border border-indigo-500/20 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300 my-auto">
                    <button 
                        onClick={() => {setTargetPlan(null); setShowUnlockModal(false);}} 
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                        aria-label="Close"
                    >
                        <X size={24}/>
                    </button>
                    <button 
                        onClick={() => setTargetPlan(null)} 
                        className="absolute top-4 left-4 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                        <ArrowLeft size={14}/> Назад
                    </button>
                    
                    <div className="flex flex-col items-center gap-4 text-center mt-6">
                        <div className={`p-4 rounded-2xl text-white shadow-xl ${targetPlan === 'plus' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'}`}>
                            {targetPlan === 'plus' ? <Zap size={32} fill="currentColor"/> : <Crown size={32} fill="currentColor"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Активирай {targetPlan === 'plus' ? 'Plus' : 'Pro'}</h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Въведете вашия код за достъп.</p>
                        </div>
                    </div>
                    
                    <input
                        type="text"
                        value={unlockKeyInput}
                        onChange={e => setUnlockKeyInput(e.target.value)}
                        placeholder="Въведете код"
                        className="w-full bg-gray-100 dark:bg-black/50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-500 text-center font-bold text-lg tracking-wider transition-all"
                        autoFocus
                    />
                    
                    <Button onClick={handleUnlockSubmit} className={`w-full py-4 text-base shadow-lg border-none ${targetPlan === 'plus' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-orange-500/30'}`}>
                        Активирай Сега
                    </Button>
                </div>
            </div>
        );
    }

    // Main view for selecting a plan
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
        {/* Sticky Close Button for Mobile Accessibility */}
        <div className="sticky top-0 inset-x-0 p-4 flex justify-end z-50 pointer-events-none">
            <button 
                onClick={() => setShowUnlockModal(false)} 
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto shadow-lg"
                aria-label="Close"
            >
                <X size={24}/>
            </button>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 pb-20 pt-4 flex flex-col items-center">
           <div className="text-center space-y-4 mb-10 animate-in slide-up duration-500">
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Избери своя план</h2>
               <p className="text-lg md:text-xl text-gray-400 font-medium max-w-lg mx-auto">Отключете пълния потенциал на Uchebnik AI</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
              {/* Free Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[32px] p-8 border border-gray-200 dark:border-white/5 flex flex-col relative overflow-hidden animate-in slide-up duration-500" style={{animationDelay: '100ms'}}>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free Plan</div>
                    <div className="text-3xl font-black dark:text-white">Безплатен</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> 4 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Стандартна скорост</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300"><CheckCircle size={18} className="text-gray-400 shrink-0"/> Gemma 3 (4B)</div>
                 </div>
                 <button disabled={true} className="w-full py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default transition-all">
                    {userPlan === 'free' ? 'Текущ план' : 'Стандартен'}
                 </button>
              </div>

              {/* Plus Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[32px] p-8 border-2 border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-500/10 scale-100 md:scale-105 z-10 animate-in slide-up duration-500" style={{animationDelay: '200ms'}}>
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={16} fill="currentColor"/> Plus Plan</div>
                    <div className="text-3xl font-black dark:text-white">Plus</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> 12 изображения на ден</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> По-бърза скорост</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-white"><CheckCircle size={18} className="text-indigo-500 shrink-0"/> Gemma 3 (12B)</div>
                 </div>
                 <button 
                    onClick={() => { if(userPlan !== 'plus') setTargetPlan('plus'); }} 
                    disabled={userPlan === 'plus'}
                    className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${userPlan === 'plus' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'}`}
                 >
                    {userPlan === 'plus' ? 'Текущ план' : 'Избери Plus'}
                 </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[32px] p-8 border border-amber-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-amber-500/10 animate-in slide-up duration-500" style={{animationDelay: '300ms'}}>
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"/>
                 <div className="mb-6">
                    <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={16} fill="currentColor"/> Pro Plan</div>
                    <div className="text-3xl font-black dark:text-white">Pro</div>
                 </div>
                 <div className="space-y-4 flex-1 mb-8">
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Неограничени изображения</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Най-бърза скорост</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200"><CheckCircle size={18} className="text-amber-500 shrink-0"/> Gemma 3 (27B)</div>
                 </div>
                 <button 
                    onClick={() => { if(userPlan !== 'pro') setTargetPlan('pro'); }}
                    disabled={userPlan === 'pro'} 
                    className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${userPlan === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-orange-500/25'}`}
                 >
                    {userPlan === 'pro' ? 'Текущ план' : 'Избери Pro'}
                 </button>
              </div>
           </div>
           
           <div className="mt-12 text-center text-gray-500 text-sm font-medium opacity-60">
               Всички планове включват достъп до всички учебни предмети.
           </div>
        </div>
      </div>
    );
};
