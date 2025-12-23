
import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown, Zap, Shield, HelpCircle, Info } from 'lucide-react';
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

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className={`w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] ${MODAL_ENTER}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                
                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between shrink-0 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy size={20} className="text-amber-400" fill="currentColor"/>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Hall of Fame</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Класация</h2>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-2 rounded-full transition-colors border ${showInfo ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'}`}
                        >
                            <Info size={20}/>
                        </button>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Help Banner (Toggleable) */}
                {showInfo && (
                    <div className="mx-6 mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <Zap size={14} className="text-amber-400" fill="currentColor"/> Как да се издигна?
                        </h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Печелете <strong className="text-amber-400">XP</strong> (опит) като учите!
                            <br/>• Писане на съобщения: <strong>20 XP</strong>
                            <br/>• Качване на снимки: <strong>40 XP</strong>
                            <br/>• Гласови разговори: <strong>60 XP</strong>
                            <br/>Събирайте XP, за да качвате нива и да отключвате нови рангове (Bronze, Silver, Gold...).
                        </p>
                    </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 bg-white/5 relative z-10 backdrop-blur-sm">
                    <div className="col-span-2 text-center">Ранк</div>
                    <div className="col-span-7">Ученик & Ниво</div>
                    <div className="col-span-3 text-right">Общо XP</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/>
                            <p className="text-zinc-500 text-sm font-medium">Зареждане на шампионите...</p>
                        </div>
                    ) : (
                        entries.map((entry) => {
                            const rankInfo = getRank(entry.level);
                            const RankIcon = rankInfo.icon;
                            
                            // Styling for Top 3
                            const isTop1 = entry.rank === 1;
                            const isTop2 = entry.rank === 2;
                            const isTop3 = entry.rank === 3;
                            
                            let rankBadgeClass = "bg-white/5 text-zinc-400 font-medium";
                            if (isTop1) rankBadgeClass = "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-400/50 font-black";
                            if (isTop2) rankBadgeClass = "bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg ring-1 ring-gray-400/50 font-black";
                            if (isTop3) rankBadgeClass = "bg-gradient-to-br from-orange-300 to-orange-600 text-black shadow-lg ring-1 ring-orange-400/50 font-black";

                            return (
                                <div 
                                    key={entry.userId} 
                                    className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl transition-all relative overflow-hidden group ${
                                        entry.isCurrentUser 
                                        ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                                        : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    {/* Rank Column */}
                                    <div className="col-span-2 flex justify-center relative z-10">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm ${rankBadgeClass}`}>
                                            {isTop1 ? <Crown size={16} fill="black" /> : entry.rank}
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
                                                    <span className="text-xs font-bold text-zinc-500">{entry.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            {/* Rank Tier Badge - Smaller */}
                                            <div className="absolute -bottom-1 -right-1 bg-[#09090b] rounded-full p-[2px]">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br ${rankInfo.gradient} ring-1 ring-black`}>
                                                    <RankIcon size={8} className="text-white drop-shadow-sm"/>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-white' : 'text-zinc-200'}`}>
                                                    {entry.name}
                                                </span>
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
                                        <span className="text-sm font-mono font-bold text-white tracking-tight flex items-center justify-end gap-1">
                                            {entry.xp.toLocaleString()} 
                                            <span className="text-amber-500"><Zap size={10} fill="currentColor"/></span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer (Current User Stats) */}
                {currentUserEntry && (
                    <div className="p-4 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/10 shrink-0 relative z-20">
                        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5 shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ти си тук</div>
                                    <div className="font-black text-xl text-white">#{currentUserEntry.rank}</div>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Общо XP</div>
                                <div className="font-bold text-white font-mono flex items-center justify-end gap-1">
                                    {currentUserEntry.xp.toLocaleString()}
                                    <Zap size={12} className="text-amber-500" fill="currentColor"/>
                                </div>
                            </div>
                        </div>
                        {currentUserEntry.rank > 3 && (
                            <p className="text-center text-[10px] text-zinc-500 mt-3 font-medium">
                                Продължавай да учиш, за да стигнеш върха! 🚀
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
