
import React, { useEffect, useState } from 'react';
import { X, Trophy, User, Crown, Medal } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { LeaderboardEntry } from '../../types';
import { getRank, calculateLevel } from '../../utils/gamification';
import { MODAL_ENTER } from '../../animations/transitions';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
}

export const LeaderboardModal = ({ isOpen, onClose, currentUserId }: LeaderboardModalProps) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // Fetch top 50 users by XP
            const { data, error } = await supabase
                .from('profiles')
                .select('id, xp, level, settings, avatar_url')
                .order('xp', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (data) {
                const mapped: LeaderboardEntry[] = data.map((profile: any, index: number) => {
                    const settings = typeof profile.settings === 'string' 
                        ? JSON.parse(profile.settings) 
                        : profile.settings;
                    
                    // Fallback level calculation if not in DB yet
                    const level = profile.level || calculateLevel(profile.xp || 0);
                    
                    // Prioritize dedicated avatar_url, fall back to settings, then null
                    const avatar = profile.avatar_url || settings?.avatar || null;

                    return {
                        userId: profile.id,
                        name: settings?.userName || 'Anonymous Scholar',
                        avatar: avatar,
                        xp: profile.xp || 0,
                        level: level,
                        rank: index + 1,
                        isCurrentUser: profile.id === currentUserId
                    };
                });
                setEntries(mapped);
            }
        } catch (e) {
            console.error("Leaderboard fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-b from-amber-500/10 to-transparent flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Trophy size={24} fill="currentColor" className="text-amber-400"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Класация</h2>
                            <p className="text-xs text-zinc-400">Топ Ученици</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* List Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 bg-black/20">
                    <div className="col-span-2 text-center">Ранк</div>
                    <div className="col-span-7">Потребител</div>
                    <div className="col-span-3 text-right">Общо XP</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-4">
                            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"/>
                            <p className="text-zinc-500 text-sm">Зареждане на класацията...</p>
                        </div>
                    ) : (
                        entries.map((entry) => {
                            const rankInfo = getRank(entry.level);
                            const RankIcon = rankInfo.icon;
                            
                            return (
                                <div 
                                    key={entry.userId} 
                                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all ${
                                        entry.isCurrentUser 
                                        ? 'bg-indigo-500/20 border border-indigo-500/50' 
                                        : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    {/* Rank Column */}
                                    <div className="col-span-2 flex justify-center">
                                        <div className={`w-8 h-8 flex items-center justify-center font-black rounded-lg ${
                                            entry.rank === 1 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' :
                                            entry.rank === 2 ? 'bg-gray-300 text-black shadow-lg' :
                                            entry.rank === 3 ? 'bg-amber-700 text-white shadow-lg' :
                                            'text-zinc-500 bg-white/5'
                                        }`}>
                                            {entry.rank}
                                        </div>
                                    </div>

                                    {/* User Info Column */}
                                    <div className="col-span-7 flex items-center gap-3 min-w-0">
                                        <div className="relative shrink-0">
                                            <div 
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 border-2 overflow-hidden transition-colors"
                                                style={{ borderColor: rankInfo.color }}
                                            >
                                                {entry.avatar ? (
                                                    <img src={entry.avatar} className="w-full h-full object-cover" loading="lazy" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-500">{entry.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/10">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${rankInfo.gradient}`}>
                                                    <RankIcon size={8} className="text-white/90"/>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-white' : 'text-zinc-200'}`}>
                                                    {entry.name}
                                                </span>
                                                {entry.rank === 1 && <Crown size={12} className="text-yellow-500 fill-yellow-500 shrink-0"/>}
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${entry.isCurrentUser ? 'bg-indigo-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                                                Lvl {entry.level}
                                            </span>
                                        </div>
                                    </div>

                                    {/* XP Column */}
                                    <div className="col-span-3 text-right flex flex-col justify-center">
                                        <span className="text-sm font-mono font-bold text-white tracking-tight">
                                            {entry.xp.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">XP</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer (Current User) */}
                {currentUserId && entries.find(e => e.isCurrentUser) && (
                    <div className="p-4 bg-indigo-500/10 border-t border-indigo-500/20 flex justify-center backdrop-blur-md">
                        <span className="text-xs font-bold text-indigo-300">
                            Ти си на позиция #{entries.find(e => e.isCurrentUser)?.rank}! Продължавай напред! 🚀
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
