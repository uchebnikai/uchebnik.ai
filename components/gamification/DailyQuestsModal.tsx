
import React from 'react';
import { X, CheckCircle, Target, Clock, Zap, Star, Trophy, Sparkles } from 'lucide-react';
import { DailyQuest } from '../../types';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';
import { getQuestIcon } from '../../utils/gamification';

interface DailyQuestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: DailyQuest[];
}

export const DailyQuestsModal = ({ isOpen, onClose, quests }: DailyQuestsModalProps) => {
    if (!isOpen) return null;

    const completedCount = quests.filter(q => q.isCompleted).length;
    const totalQuests = quests.length;
    const progress = totalQuests > 0 ? (completedCount / totalQuests) * 100 : 0;
    const allCompleted = completedCount === totalQuests && totalQuests > 0;
    const totalPossibleXP = quests.reduce((acc, q) => acc + q.xpReward, 0);
    const earnedXP = quests.filter(q => q.isCompleted).reduce((acc, q) => acc + q.xpReward, 0);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header Background */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-900/40 via-purple-900/20 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between shrink-0 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Target size={24} className="text-indigo-400" fill="currentColor"/> Дневни Мисии
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                            <Clock size={12}/>
                            <span>Ресет в 00:00</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                        <X size={20}/>
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-6 pt-4 space-y-6 relative z-10">
                    
                    {/* Progress Summary */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-800 to-zinc-900 border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Общо XP</span>
                                <span className="text-2xl font-black text-white flex items-center gap-2">
                                    <Zap size={20} className={allCompleted ? "text-amber-400 fill-amber-400" : "text-indigo-400"} />
                                    {earnedXP} <span className="text-zinc-500 text-sm">/ {totalPossibleXP}</span>
                                </span>
                            </div>
                            <div className="text-right">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${allCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-zinc-400 border border-white/5'}`}>
                                    {completedCount}/{totalQuests} Завършени
                                </div>
                            </div>
                        </div>

                        {/* Custom Progress Bar */}
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-700 ease-out relative ${allCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"/>
                            </div>
                        </div>
                    </div>

                    {/* Quest List */}
                    <div className="space-y-3">
                        {quests.map((quest, i) => {
                            const QuestIcon = getQuestIcon(quest.type);
                            const percent = Math.min(100, (quest.current / quest.target) * 100);
                            
                            return (
                                <div 
                                    key={quest.id} 
                                    className={`relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${
                                        quest.isCompleted 
                                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    } ${FADE_IN}`}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {/* Active Glow for Incomplete */}
                                    {!quest.isCompleted && (
                                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-indigo-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]"/>
                                    )}

                                    <div className="flex items-center gap-4 relative z-10">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                                            quest.isCompleted 
                                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                            : 'bg-black/40 border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20'
                                        }`}>
                                            {quest.isCompleted ? <CheckCircle size={24} fill="none" strokeWidth={2.5}/> : <QuestIcon size={20}/>}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold text-sm truncate pr-2 ${quest.isCompleted ? 'text-emerald-100/70 line-through' : 'text-white'}`}>
                                                    {quest.description}
                                                </h4>
                                                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                                    quest.isCompleted 
                                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                                    : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                    <Zap size={10} fill="currentColor"/> {quest.xpReward} XP
                                                </div>
                                            </div>
                                            
                                            {/* Progress Info */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden mr-3">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${quest.isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <div className={`text-xs font-mono font-bold ${quest.isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                    {quest.current}/{quest.target}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Completion Confetti Effect (Static) */}
                                    {quest.isCompleted && (
                                        <>
                                            <Sparkles size={12} className="absolute top-2 right-12 text-emerald-400/50 animate-pulse"/>
                                            <Sparkles size={16} className="absolute bottom-2 left-16 text-emerald-400/30 animate-pulse delay-75"/>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
