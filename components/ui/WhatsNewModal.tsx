import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { MODAL_ENTER } from '../../animations/transitions';
import { Button } from './Button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  if (!isOpen || CHANGELOG.length === 0) return null;

  // Only show the latest change
  const latestChange = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-sm bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-8 pb-2 flex flex-col items-center text-center relative z-10">
            <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 rotate-3">
                <Sparkles size={28} fill="currentColor" />
            </div>
            
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display mb-1">
                Последни промени
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                v{latestChange.version} • {latestChange.date}
            </p>
            
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400 transition-colors"
            >
                <X size={18}/>
            </button>
        </div>

        {/* Content - Highlight Card */}
        <div className="p-8 pt-6 relative z-10">
            <div className="p-6 rounded-[28px] bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                        {latestChange.title}
                    </h4>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    {latestChange.description}
                </p>
            </div>
        </div>

        {/* Footer - Simple Action */}
        <div className="p-8 pt-0">
            <Button 
                onClick={onClose} 
                className="w-full py-4 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
                Разбрах
            </Button>
        </div>
      </div>
    </div>
  );
};