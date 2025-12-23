
import { Medal, Trophy, Crown, Gem, Star } from 'lucide-react';
import { RankInfo, RankTier } from '../types';

// Constants - Increased base rewards for satisfaction
export const XP_PER_MESSAGE = 25; 
export const XP_PER_IMAGE = 50;
export const XP_PER_VOICE = 40;

/**
 * XP Curve Logic:
 * We use a quadratic formula to ensure early levels are fast, but it gets harder later.
 * Formula: XP = 50 * (Level - 1)^1.6
 * 
 * Level 1: 0 XP
 * Level 2: 50 XP (2 messages)
 * Level 3: 150 XP (Total)
 * Level 4: 300 XP (Total)
 * ...
 */

export const getLevelBaseXP = (level: number): number => {
    if (level <= 1) return 0;
    // Non-linear curve: starts easy, gets steeper
    return Math.floor(50 * Math.pow(level - 1, 1.6));
};

export const calculateLevel = (xp: number): number => {
    // Approximate inverse of the formula to find level from XP
    // This is a rough estimation, we iterate to find exact for precision at boundaries
    let level = 1;
    while (getLevelBaseXP(level + 1) <= xp) {
        level++;
    }
    return level;
};

// Calculate progress percentage to next level
// Returns: { progress: number (0-100), currentXPInLevel, xpNeededForLevel }
export const getLevelProgressStats = (xp: number, level: number) => {
    const currentLevelBase = getLevelBaseXP(level);
    const nextLevelBase = getLevelBaseXP(level + 1);
    
    const xpNeededForNext = nextLevelBase - currentLevelBase;
    const xpGainedInCurrent = xp - currentLevelBase;
    
    // Safety check to prevent division by zero or negative
    if (xpNeededForNext <= 0) return { progress: 100, current: 0, total: 0 };

    const progress = Math.min(100, Math.max(0, (xpGainedInCurrent / xpNeededForNext) * 100));
    
    return {
        progress,
        current: xpGainedInCurrent,
        total: xpNeededForNext,
        nextLevelThreshold: nextLevelBase
    };
};

// Deprecated wrapper for backward compatibility if needed, but prefer getLevelProgressStats
export const getLevelProgress = (xp: number, level: number): number => {
    return getLevelProgressStats(xp, level).progress;
};

export const RANKS: RankInfo[] = [
    {
        id: 'bronze',
        name: 'Начинаещ', // Beginner
        minLevel: 1,
        color: '#cd7f32',
        gradient: 'from-orange-700 to-orange-400',
        icon: Medal
    },
    {
        id: 'silver',
        name: 'Напреднал', // Advanced
        minLevel: 5,
        color: '#c0c0c0',
        gradient: 'from-slate-400 to-slate-100',
        icon: Medal
    },
    {
        id: 'gold',
        name: 'Експерт', // Expert
        minLevel: 15,
        color: '#ffd700',
        gradient: 'from-yellow-600 to-yellow-300',
        icon: Trophy
    },
    {
        id: 'platinum',
        name: 'Майстор', // Master
        minLevel: 30,
        color: '#e5e4e2',
        gradient: 'from-cyan-700 to-cyan-300',
        icon: Crown
    },
    {
        id: 'diamond',
        name: 'Легенда', // Legend
        minLevel: 50,
        color: '#b9f2ff',
        gradient: 'from-blue-600 via-indigo-400 to-cyan-300',
        icon: Gem
    }
];

export const getRank = (level: number): RankInfo => {
    const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
    return rank || RANKS[0];
};
