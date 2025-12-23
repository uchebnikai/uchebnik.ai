
import React from 'react';
import { X, CheckCircle, Target, Clock, Zap } from 'lucide-react';
import { DailyQuest } from '../../types';
import { MODAL_ENTER } from '../../animations/transitions';

interface DailyQuestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: DailyQuest[];
}

export const DailyQuestsModal = ({ isOpen, onClose, quests }: DailyQuestsModalProps) => {
    if (!isOpen) return null;

    const completedCount = quests.filter(q => q.isCompleted).length;
    const progress = (completedCount / quests.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between shrink-0 relative z-10 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <Target size={24} className="text-pink-500" fill="currentColor"/> Дневни Мисии
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-indigo-200 mt-1">
                            <Clock size={12}/>
                            <span>Нови мисии всеки ден в 00:00</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-zinc-300 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                            <span>Прогрес</span>
                            <span className="text-white">{completedCount}/{quests.length}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-500 ease-out" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Quest List */}
                    <div className="space-y-3">
                        {quests.map((quest) => (
                            <div 
                                key={quest.id} 
                                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                                    quest.isCompleted 
                                    ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-900/10 border-emerald-500/30' 
                                    : 'bg-white/5 border-white/10'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${quest.isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                            {quest.description}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1 font-mono">
                                            <span className={quest.isCompleted ? 'text-emerald-500' : 'text-zinc-300'}>{quest.current}</span>
                                            <span>/</span>
                                            <span>{quest.target}</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${quest.isCompleted ? 'bg-emerald-500 text-black' : 'bg-white/10 text-amber-400'}`}>
                                        {quest.isCompleted ? <CheckCircle size={14}/> : <Zap size={14} fill="currentColor"/>}
                                        <span>{quest.isCompleted ? 'Готово' : `+${quest.xpReward} XP`}</span>
                                    </div>
                                </div>

                                {/* Mini Progress Bar for incomplete quests */}
                                {!quest.isCompleted && (
                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mt-2 relative z-10">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                                            style={{ width: `${(quest.current / quest.target) * 100}%` }}
                                        />
                                    </div>
                                )}
                                
                                {quest.isCompleted && (
                                    <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"/>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
