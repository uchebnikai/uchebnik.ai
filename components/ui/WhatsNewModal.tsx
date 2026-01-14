import React from 'react';
import { X, Sparkles, ArrowRight, Star, Calendar, Zap, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-md bg-white dark:bg-[#0c0c0e] border border-indigo-500/20 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Ambient Background */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-600/15 blur-[60px] rounded-full pointer-events-none animate-pulse" />
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all z-20"
        >
          <X size={18}/>
        </button>

        <div className="p-8 lg:p-10 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-6 transform hover:scale-105 transition-transform duration-500 rotate-3">
                <Sparkles size={32} className="text-white" fill="currentColor" />
            </div>

            <div className="space-y-1 mb-8">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight font-display">Какво ново?</h2>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        v{latestUpdate.version}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {latestUpdate.date}
                    </span>
                </div>
            </div>

            <div className="w-full mb-8 relative group">
                <div className="relative p-6 rounded-[28px] bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-left backdrop-blur-sm shadow-inner overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Zap size={80} fill="currentColor" className="text-indigo-500" />
                    </div>
                    
                    <h4 className="font-black text-zinc-900 dark:text-white text-lg mb-3 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-indigo-500" />
                        {latestUpdate.title}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {latestUpdate.description}
                    </p>
                </div>
            </div>

            <div className="w-full space-y-4">
                <Button 
                    onClick={onClose} 
                    className="w-full py-4 text-base shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] font-black group"
                >
                    Започни ученето <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center justify-center gap-2 pt-2 opacity-40">
                    <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-800" />
                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                        Създадено с ❤️ за българските ученици
                    </span>
                    <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-800" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};