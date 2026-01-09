
import React from 'react';
import { X, Heart, Coffee, Sparkles, ArrowUpRight, Info, Zap } from 'lucide-react';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';
import { UserSettings } from '../../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
}

export const DonationModal = ({ isOpen, onClose, userSettings }: DonationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Background Glows */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-rose-500/20 via-pink-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-600/30 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 -left-20 w-48 h-48 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all z-20 border border-white/5">
            <X size={20}/>
        </button>

        <div className="p-8 pt-10 relative z-10 flex flex-col items-center text-center">
            {/* Heart & Icon Header */}
            <div className="relative mb-8 group">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(244,63,94,0.3)] transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 ring-4 ring-white/5">
                    <Heart size={48} className="text-white" fill="currentColor" />
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 animate-bounce"><Sparkles size={20} className="text-amber-400 fill-amber-400"/></div>
                <div className="absolute -bottom-2 -left-2 animate-pulse delay-700"><Heart size={24} className="text-rose-300/50" fill="currentColor"/></div>
            </div>

            <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">
                Подкрепи мисията ни
            </h2>
            
            <p className="text-zinc-400 text-base leading-relaxed mb-8 px-4">
                Uchebnik AI е създаден с много любов от малък екип, който вярва в бъдещето на образованието. Твоята подкрепа ни помага да запазим платформата <strong>безплатна</strong> и достъпна за всеки ученик.
            </p>

            {/* Support Card Area */}
            <div className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 mb-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col gap-6 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-black/20 border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                <Coffee size={20} fill="currentColor"/>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">Черпи ни едно кафе</h4>
                                <p className="text-[11px] text-zinc-500">Малък жест с голям смисъл за нас.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-black/20 border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                                <Zap size={20} fill="currentColor"/>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">100% за каузата</h4>
                                <p className="text-[11px] text-zinc-500">Даренията отиват за нови функции.</p>
                            </div>
                        </div>
                    </div>

                    <a 
                        href="https://buymeacoffee.com/uchebnikai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-5 bg-[#FFDD00] hover:bg-[#FFD700] text-black rounded-2xl font-black text-lg shadow-[0_15px_30px_rgba(255,221,0,0.25)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group/btn"
                    >
                        <img src="https://cdn.buymeacoffee.com/widget/assets/images/BMC-btn-logo.svg" alt="BMC" className="w-6 h-6" />
                        <span>Дари чрез кафе</span>
                        <ArrowUpRight size={22} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </a>
                </div>
            </div>

            <p className="text-[11px] text-rose-500 font-black uppercase tracking-[0.3em] mb-4">
                Благодарим, че си част от промяната! ❤️
            </p>
        </div>

        {/* Informational Footer */}
        <div className="p-5 bg-black/40 border-t border-white/5 backdrop-blur-md">
            <div className="flex items-start gap-3 text-[10px] text-zinc-500 font-medium px-4 leading-relaxed">
                <Info size={14} className="shrink-0 text-rose-500 mt-0.5"/>
                <p>Uchebnik AI винаги ще предоставя безплатни инструменти за учене. Твоето дарение помага на проекта да расте устойчиво.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
