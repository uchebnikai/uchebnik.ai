
import React from 'react';
import { X, Heart, Coffee, CreditCard, ExternalLink, Globe, Sparkles, Server, Zap } from 'lucide-react';
import { MODAL_ENTER } from '../../animations/transitions';
import { t } from '../../utils/translations';
import { UserSettings } from '../../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
}

export const DonationModal = ({ isOpen, onClose, userSettings }: DonationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Background Decorative */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-500/20 to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/20 blur-[80px] rounded-full pointer-events-none" />

        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors z-20">
            <X size={20}/>
        </button>

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 mb-6 group transition-all duration-300 hover:scale-110">
                <Heart size={32} className="text-white group-hover:animate-pulse" fill="currentColor" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Подкрепи Uchebnik AI</h2>
            <p className="text-zinc-400 mb-8 max-w-sm leading-relaxed">
                Вашата подкрепа ни помага да поддържаме сървърите и да разработваме нови функции за българското образование.
            </p>

            <div className="grid grid-cols-1 gap-4 w-full mb-8">
                {/* Buy Me a Coffee Option */}
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Coming soon! Buy Me a Coffee link will be here."); }}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-amber-500/50 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                            <Coffee size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-white group-hover:text-amber-400 transition-colors">Купи ни кафе</div>
                            <div className="text-xs text-zinc-500">Buy Me a Coffee</div>
                        </div>
                    </div>
                    <ExternalLink size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                </a>

                {/* Stripe / Card Option */}
                <button 
                    onClick={() => alert("Coming soon! Stripe donation portal will be here.")}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all group text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">Дарение с карта</div>
                            <div className="text-xs text-zinc-500">Сигурно плащане със Stripe</div>
                        </div>
                    </div>
                    <div className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-md">Скоро</div>
                </button>

                {/* Revolut / PayPal Placeholder */}
                <button 
                    onClick={() => alert("Coming soon! Revolut/PayPal info will be here.")}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/50 transition-all group text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                            <Globe size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">PayPal / Revolut</div>
                            <div className="text-xs text-zinc-500">Международни преводи</div>
                        </div>
                    </div>
                    <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-md">Скоро</div>
                </button>
            </div>

            {/* Why Support Section */}
            <div className="w-full grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl">
                    <Server size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Сървъри</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl">
                    <Zap size={20} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Разработка</span>
                </div>
            </div>

            <p className="mt-8 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                Благодарим за доверието! ❤️
            </p>
        </div>
      </div>
    </div>
  );
};
