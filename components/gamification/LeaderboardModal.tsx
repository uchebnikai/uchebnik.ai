
import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown, Zap, Shield, HelpCircle, Info, Medal, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { LeaderboardEntry } from '../../types';
import { getRank, calculateLevel } from '../../utils/gamification';
import { MODAL_ENTER, FADE_IN } from '../../animations/transitions';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
}

export const LeaderboardModal = ({ isOpen, onClose, currentUserId }: LeaderboardModalProps) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

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

    const currentUserEntry = entries.find(e => e.isCurrentUser);

    const getRankStyles = (rank: number) => {
        if (rank === 1) return {
            badge: "bg-gradient-to-b from-yellow-300 to-yellow-600 text-white shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-200 border-none scale-110",
            row: "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20",
            icon: <Crown size={14} fill="currentColor" className="text-white"/>
        };
        if (rank === 2) return {
            badge: "bg-gradient-to-b from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-500/40 ring-2 ring-slate-200 border-none scale-105",
            row: "bg-gradient-to-r from-slate-500/10 to-transparent border-slate-500/20",
            icon: <Medal size={14} fill="currentColor" className="text-white"/>
        };
        if (rank === 3) return {
            badge: "bg-gradient-to-b from-orange-300 to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-200 border-none scale-105",
            row: "bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/20",
            icon: <Medal size={14} fill="currentColor" className="text-white"/>
        };
        return {
            badge: "bg-white/5 text-zinc-400 font-bold border border-white/10",
            row: "hover:bg-white/5 border-transparent",
            icon: null
        };
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-10 -left-10 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />
                
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between shrink-0 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Trophy size={28} className="text-amber-400" fill="currentColor"/> Класация
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-2.5 rounded-full transition-all border ${showInfo ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'}`}
                        >
                            <Info size={20}/>
                        </button>
                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Help Banner (Toggleable) */}
                {showInfo && (
                    <div className="mx-6 mb-4 p-5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl animate-in slide-in-from-top-2 backdrop-blur-md">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-amber-400" fill="currentColor"/> Как да се издигна?
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-zinc-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"/> Писане на съобщения</span>
                                <span className="font-mono text-white font-bold">+20 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"/> Качване на снимки</span>
                                <span className="font-mono text-white font-bold">+40 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"/> Гласови разговори</span>
                                <span className="font-mono text-white font-bold">+60 XP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 bg-black/20 relative z-10 backdrop-blur-sm">
                    <div className="col-span-2 text-center">#</div>
                    <div className="col-span-7">Потребител</div>
                    <div className="col-span-3 text-right">XP</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/>
                            <p className="text-zinc-500 text-sm font-medium animate-pulse">Зареждане на шампионите...</p>
                        </div>
                    ) : (
                        entries.map((entry, index) => {
                            const rankInfo = getRank(entry.level);
                            const RankIcon = rankInfo.icon;
                            const styles = getRankStyles(entry.rank);
                            
                            return (
                                <div 
                                    key={entry.userId} 
                                    className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl transition-all relative overflow-hidden group border ${styles.row} ${
                                        entry.isCurrentUser 
                                        ? 'bg-indigo-500/10 !border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20' 
                                        : ''
                                    } ${FADE_IN}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Rank Column */}
                                    <div className="col-span-2 flex justify-center relative z-10">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-transform duration-300 group-hover:scale-110 ${styles.badge}`}>
                                            {styles.icon || entry.rank}
                                        </div>
                                    </div>

                                    {/* User Info Column */}
                                    <div className="col-span-7 flex items-center gap-3 min-w-0 relative z-10">
                                        <div className="relative shrink-0">
                                            <div 
                                                className={`w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 overflow-hidden transition-colors ring-2 ring-offset-2 ring-offset-[#09090b] ${entry.isCurrentUser ? 'ring-indigo-500' : 'ring-transparent'}`}
                                                style={{ borderColor: rankInfo.color, borderWidth: '2px', borderStyle: 'solid' }}
                                            >
                                                {entry.avatar ? (
                                                    <img src={entry.avatar} className="w-full h-full object-cover" loading="lazy" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                                                        <User size={16} className="text-zinc-400"/>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Rank Tier Badge - Smaller */}
                                            <div className="absolute -bottom-1 -right-1 bg-[#09090b] rounded-full p-[2px] z-20">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${rankInfo.gradient} ring-1 ring-black shadow-sm`}>
                                                    <RankIcon size={8} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"/>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-white' : 'text-zinc-200'}`}>
                                                    {entry.name}
                                                </span>
                                                {entry.isCurrentUser && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-indigo-500/20">YOU</span>}
                                            </div>
                                            {/* Explicit Tier Label */}
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-zinc-500">Lvl {entry.level}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: rankInfo.color }}>
                                                    {rankInfo.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* XP Column */}
                                    <div className="col-span-3 text-right flex flex-col justify-center relative z-10">
                                        <span className="text-sm font-mono font-bold text-white tracking-tight flex items-center justify-end gap-1.5">
                                            {entry.xp.toLocaleString()} 
                                            <Zap size={12} className="text-amber-400" fill="currentColor"/>
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer (Current User Stats) */}
                {currentUserEntry && (
                    <div className="p-4 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 shrink-0 relative z-20">
                        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
                                    <div className="text-xs font-black">#{currentUserEntry.rank}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">Твоята позиция</div>
                                    <div className="font-bold text-white text-base">Ниво {currentUserEntry.level}</div>
                                </div>
                            </div>
                            
                            <div className="text-right relative z-10">
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Общо XP</div>
                                <div className="font-black text-xl text-white font-mono flex items-center justify-end gap-1.5">
                                    {currentUserEntry.xp.toLocaleString()}
                                    <Zap size={16} className="text-amber-400" fill="currentColor"/>
                                </div>
                            </div>
                        </div>
                        {currentUserEntry.rank > 3 && (
                            <p className="text-center text-[10px] text-zinc-500 mt-3 font-medium animate-pulse">
                                Продължавай да учиш, за да стигнеш върха! 🚀
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
