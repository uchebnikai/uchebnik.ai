import React from 'react';
import { X, Sparkles, Check, ArrowRight, Zap, Star } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { MODAL_ENTER, FADE_IN, SLIDE_UP } from '../../animations/transitions';
import { Button } from './Button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  if (!isOpen) return null;

  // Show only the latest 3 entries to keep it clean
  const recentChanges = CHANGELOG.slice(0, 3);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-lg bg-white dark:bg-[#09090b] border border-indigo-500/20 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Background */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="p-8 pb-4 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6 group">
                <Sparkles size={32} className="text-white animate-pulse" fill="currentColor" />
            </div>

            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight font-display">Какво ново?</h2>
            <p className="text-zinc-500 font-medium mb-8">Виж последните подобрения в Uchebnik AI</p>

            <div className="w-full space-y-4 mb-8">
                {recentChanges.map((entry, i) => (
                    <div 
                        key={entry.version} 
                        className={`p-5 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-left group hover:border-indigo-500/30 transition-all ${SLIDE_UP}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                {entry.title}
                            </h4>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                v{entry.version}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            {entry.description}
                        </p>
                    </div>
                ))}
            </div>

            <Button 
                onClick={onClose} 
                className="w-full py-4 text-base shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black"
            >
                Разбрах! <ArrowRight size={18} className="ml-1" />
            </Button>
            
            <p className="mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Star size={10} fill="currentColor" />
                Благодарим ти, че учиш с нас
            </p>
        </div>
      </div>
    </div>
  );
};
