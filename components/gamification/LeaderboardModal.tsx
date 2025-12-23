
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
    const [userRank, setUserRank] = useState<number | null>(null);

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
                .select('id, xp, level, settings')
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

                    return {
                        userId: profile.id,
                        name: settings?.userName || 'Anonymous Scholar',
                        avatar: settings?.avatar || null,
                        xp: profile.xp || 0,
                        level: level,
                        rank: index + 1,
                        isCurrentUser: profile.id === currentUserId
                    };
                });
                setEntries(mapped);

                // Find current user rank if not in top 50
                if (currentUserId && !mapped.find(e => e.isCurrentUser)) {
                    // Logic to find exact rank would require a count query, 
                    // for now we just show them if they are in top 50.
                }
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
                            <h2 className="text-xl font-black text-white tracking-tight">Top Students</h2>
                            <p className="text-xs text-zinc-400">Global Ranking</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-4">
                            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"/>
                            <p className="text-zinc-500 text-sm">Calculating ranks...</p>
                        </div>
                    ) : (
                        entries.map((entry) => {
                            const rankInfo = getRank(entry.level);
                            const RankIcon = rankInfo.icon;
                            
                            return (
                                <div 
                                    key={entry.userId} 
                                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                                        entry.isCurrentUser 
                                        ? 'bg-white/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-8 font-black text-center ${
                                        entry.rank === 1 ? 'text-yellow-400 text-xl' :
                                        entry.rank === 2 ? 'text-gray-300 text-lg' :
                                        entry.rank === 3 ? 'text-amber-600 text-lg' :
                                        'text-zinc-500 text-sm'
                                    }`}>
                                        {entry.rank}
                                    </div>

                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${rankInfo.gradient} ring-2 ring-black`}>
                                            {entry.avatar ? (
                                                <img src={entry.avatar} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <User size={16}/>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/10">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${rankInfo.gradient}`}>
                                                <RankIcon size={8} className="text-white/80"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold truncate text-sm ${entry.isCurrentUser ? 'text-white' : 'text-zinc-300'}`}>
                                                {entry.name}
                                            </span>
                                            {entry.rank <= 3 && <Crown size={12} className="text-yellow-500 fill-yellow-500"/>}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                                            <span className="text-amber-500 font-bold">Lvl {entry.level}</span>
                                            <span>•</span>
                                            <span>{rankInfo.name}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs font-mono font-bold text-zinc-400">
                                            {entry.xp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer (Current User) */}
                {currentUserId && entries.find(e => e.isCurrentUser) && (
                    <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 flex justify-center">
                        <span className="text-xs font-medium text-amber-200">
                            You are ranked #{entries.find(e => e.isCurrentUser)?.rank}! Keep learning!
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
