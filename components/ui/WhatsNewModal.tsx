import React from 'react';
import { X, Sparkles, ArrowRight, Star, Calendar, Zap } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';
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
        className={`w-full max-w-md bg-white dark:bg-[#0c0c0e] border border-indigo-500/20 rounded-[44px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Ambient Background */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/15 blur-[80px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all z-20 shadow-sm"
        >
          <X size={20}/>
        </button>

        <div className="p-8 lg:p-10 relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 transform hover:scale-105 transition-transform duration-500 ring-4 ring-white dark:ring-zinc-900">
                <Sparkles size={40} className="text-white" fill="currentColor" />
            </div>

            <div className="space-y-2 mb-8">
                <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white tracking-tight font-display leading-tight">Новости в платформата</h2>
                <div className="flex items-center justify-center gap-2">
                    <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                        Версия {latestUpdate.version}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        <Calendar size={12} />
                        {latestUpdate.date}
                    </div>
                </div>
            </div>

            <div className="w-full mb-10 relative group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative p-6 lg:p-8 rounded-[32px] bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-left backdrop-blur-sm shadow-inner overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={60} fill="currentColor" className="text-indigo-500" />
                    </div>
                    
                    <h4 className="font-black text-zinc-900 dark:text-white text-xl mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {latestUpdate.title}
                    </h4>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {latestUpdate.description}
                    </p>
                </div>
            </div>

            <div className="w-full space-y-4">
                <Button 
                    onClick={onClose} 
                    className="w-full py-5 text-lg shadow-2xl bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black group"
                >
                    Започни ученето <ArrowRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
                    <Star size={12} className="text-amber-500" fill="currentColor" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                        Made for students by Uchebnik AI
                    </span>
                    <Star size={12} className="text-amber-500" fill="currentColor" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};