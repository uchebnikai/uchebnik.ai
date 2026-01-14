import React from 'react';
import { X, Sparkles, ArrowRight, Star, Calendar, Zap, CheckCircle2, Rocket, Stars } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { MODAL_ENTER } from '../../animations/transitions';
import { Button } from './Button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  if (!isOpen || CHANGELOG.length === 0) return null;

  const latestUpdate = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className={`w-full max-w-lg bg-white dark:bg-[#08080a] border border-indigo-500/30 rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col ring-1 ring-white/10 ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Advanced Ambient Background */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all z-30 border border-transparent hover:border-white/10"
        >
          <X size={20}/>
        </button>

        <div className="p-10 lg:p-14 relative z-10 flex flex-col items-center text-center">
            {/* Animated Icon Container */}
            <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-indigo-500/40 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-[30px] flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform hover:scale-110 transition-transform duration-700 rotate-6 group-hover:rotate-0 relative z-10 ring-4 ring-white dark:ring-[#08080a]">
                    <Rocket size={40} className="text-white fill-white/10" />
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1.5 shadow-lg animate-bounce z-20">
                    <Stars size={14} className="text-amber-900" fill="currentColor" />
                </div>
            </div>

            <div className="space-y-3 mb-10">
                <h2 className="text-3xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter font-display leading-[1.1]">
                    Последни подобрения
                </h2>
                <div className="flex items-center justify-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 shadow-inner">
                        Версия {latestUpdate.version}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {latestUpdate.date}
                    </div>
                </div>
            </div>

            <div className="w-full mb-12 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative p-8 lg:p-10 rounded-[40px] bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-left backdrop-blur-xl shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] overflow-hidden transition-all group-hover:border-indigo-500/20 group-hover:bg-white/[0.05]">
                    <div className="absolute -bottom-10 -right-10 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12">
                        <Zap size={160} fill="currentColor" className="text-indigo-500" />
                    </div>
                    
                    <h4 className="font-black text-zinc-900 dark:text-white text-xl lg:text-2xl mb-4 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} className="text-indigo-500" />
                        </div>
                        {latestUpdate.title}
                    </h4>
                    <p className="text-base lg:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {latestUpdate.description}
                    </p>
                </div>
            </div>

            <div className="w-full space-y-6">
                <Button 
                    onClick={onClose} 
                    className="w-full py-5 text-lg shadow-2xl bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Започни сега <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Button>
                
                <div className="flex items-center justify-center gap-4 pt-2 opacity-40 group/footer">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-zinc-400 dark:to-zinc-700" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.3em] group-hover:text-indigo-500 transition-colors">
                        Бъдещето на образованието в България
                    </span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-zinc-400 dark:to-zinc-700" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};