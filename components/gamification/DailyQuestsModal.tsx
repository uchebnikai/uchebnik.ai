
import React from 'react';
import { X, CheckCircle, Target, Clock, Zap, Star } from 'lucide-react';
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

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Background Effects */}
                <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-pink-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none" />
                
                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between shrink-0 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Target size={28} className="text-pink-500" fill="currentColor"/> Дневни Мисии
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-bold text-pink-300/80 mt-1 uppercase tracking-wider">
                            <Clock size={12}/>
                            <span>Ресет в 00:00</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors border border-white/5">
                        <X size={20}/>
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-6 pt-4 space-y-6 relative z-10">
                    
                    {/* Progress Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10 relative overflow-hidden">
                        {allCompleted && (
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 animate-pulse"/>
                        )}
                        <div className="flex justify-between items-end mb-3 relative z-10">
                            <div>
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Твоят Прогрес</div>
                                <div className={`text-2xl font-black ${allCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                    {allCompleted ? 'Всичко изпълнено! 🎉' : `${completedCount} от ${totalQuests} завършени`}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-black ${allCompleted ? 'text-emerald-500' : 'text-pink-500'}`}>{Math.round(progress)}%</div>
                            </div>
                        </div>
                        <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 relative z-10">
                            <div 
                                className={`h-full transition-all duration-700 ease-out relative ${allCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500'}`}
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
                                    className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                                        quest.isCompleted 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    } ${FADE_IN}`}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        {/* Icon Box */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                                            quest.isCompleted 
                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-black/30 border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20'
                                        }`}>
                                            {quest.isCompleted ? <CheckCircle size={24} fill="currentColor" className="text-emerald-500 bg-white rounded-full"/> : <QuestIcon size={20}/>}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-sm mb-1 truncate ${quest.isCompleted ? 'text-emerald-100 line-through opacity-70' : 'text-white'}`}>
                                                {quest.description}
                                            </h4>
                                            
                                            {/* XP Badge & Counter */}
                                            <div className="flex items-center justify-between">
                                                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                                    quest.isCompleted 
                                                    ? 'bg-emerald-500/20 text-emerald-300' 
                                                    : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                    <Zap size={10} fill="currentColor"/> {quest.xpReward} XP
                                                </div>
                                                <div className="text-xs font-mono font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                    {quest.current} / {quest.target}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar Background */}
                                    {!quest.isCompleted && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden rounded-b-2xl">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-500" 
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
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
