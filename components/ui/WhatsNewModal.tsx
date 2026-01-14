import React from 'react';
import { X, Sparkles, Check, Calendar, Info } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { MODAL_ENTER } from '../../animations/transitions';
import { Button } from './Button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  if (!isOpen || CHANGELOG.length === 0) return null;

  // Show the latest 4 changes to give a sense of progress without clutter
  const recentChanges = CHANGELOG.slice(0, 4);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-md bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Simple Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Sparkles size={20} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Последни промени</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uchebnik AI Update</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-zinc-200/50 dark:hover:bg-white/5 rounded-full text-zinc-400 transition-colors"
            >
                <X size={20}/>
            </button>
        </div>

        {/* Content - Simple List of Changes */}
        <div className="p-6 overflow-y-auto custom-scrollbar max-h-[60vh] space-y-4">
            {recentChanges.map((change, idx) => (
                <div 
                    key={idx} 
                    className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
                        idx === 0 
                        ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20' 
                        : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5'
                    }`}
                >
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        idx === 0 ? 'bg-indigo-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                {change.title}
                            </h4>
                            <span className="text-[9px] font-mono text-zinc-400 font-bold whitespace-nowrap">
                                v{change.version}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            {change.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 space-y-4">
            <Button 
                onClick={onClose} 
                className="w-full py-3.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20"
            >
                Разбрах
            </Button>
            
            <div className="flex items-center justify-center gap-3 opacity-30">
                <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-800" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">
                    Бъдещето на образованието
                </span>
                <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-800" />
            </div>
        </div>
      </div>
    </div>
  );
};