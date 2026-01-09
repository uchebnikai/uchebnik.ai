
import React from 'react';
import { X, Heart, Coffee, ExternalLink, Globe, Sparkles, Server, Zap, Info, ArrowUpRight } from 'lucide-react';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';
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
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Background Decorative */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-rose-500/20 via-pink-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-500/30 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-20 -left-10 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-500/20">
                    <Heart size={20} fill="currentColor" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Подкрепи ни</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                <X size={20}/>
            </button>
        </div>

        <div className="p-6 pt-4 relative z-10 flex flex-col items-center">
            {/* Main Engagement Box */}
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 text-center group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                
                <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(245,158,11,0.3)] transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-4 ring-white/5">
                        <Coffee size={48} className="text-white drop-shadow-lg" strokeWidth={2.5}/>
                    </div>
                    {/* Floating Sparkles */}
                    <div className="absolute top-0 right-1/4 animate-pulse"><Sparkles size={16} className="text-amber-300"/></div>
                    <div className="absolute bottom-2 left-1/4 animate-pulse delay-500"><Sparkles size={20} className="text-white/50"/></div>
                </div>

                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Твоето кафе зарежда проекта</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 px-2">
                    Uchebnik AI се поддържа от малък екип с голяма мечта. Твоето дарение ни помага да запазим платформата безплатна и достъпна за всеки ученик в България.
                </p>

                {/* Primary Button */}
                <a 
                    href="https://buymeacoffee.com/uchebnikai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FFDD00] hover:bg-[#FFD700] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(255,221,0,0.3)] transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 group/btn"
                >
                    <img src="https://cdn.buymeacoffee.com/widget/assets/images/BMC-btn-logo.svg" alt="BMC" className="w-6 h-6" />
                    <span>Черпи ни едно кафе</span>
                    <ArrowUpRight size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </a>
            </div>

            <div className="space-y-4 w-full px-2">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <Zap size={20} fill="currentColor"/>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-0.5">100% за платформата</h4>
                        <p className="text-xs text-zinc-500">Всички средства отиват за сървъри и нови инструменти за учене.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                        <Heart size={20} fill="currentColor"/>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-0.5">Помогни на другите</h4>
                        <p className="text-xs text-zinc-500">Твоето дарение помага на ученици без възможности да ползват Pro функции.</p>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-8 mb-4">
                Благодарим от сърце! ❤️
            </p>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium px-4">
                <Info size={14} className="shrink-0 text-indigo-400"/>
                <p>Uchebnik AI е социален проект. Твоята подкрепа е това, което ни движи напред.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
