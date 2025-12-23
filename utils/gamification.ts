
import { Medal, Trophy, Crown, Gem, Star } from 'lucide-react';
import { RankInfo, RankTier } from '../types';

// Constants
export const XP_PER_MESSAGE = 15;
export const XP_PER_IMAGE = 30;
export const XP_PER_VOICE = 50;

// Calculate Level based on XP
// Formula: XP = (Level^2) * 100
export const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Calculate XP required for next level
export const xpForNextLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel + 1, 2) * 100;
};

// Calculate progress percentage to next level
export const getLevelProgress = (xp: number, level: number): number => {
    const currentLevelBaseXP = Math.pow(level, 2) * 100;
    const nextLevelXP = Math.pow(level + 1, 2) * 100;
    const xpInLevel = xp - currentLevelBaseXP;
    const xpNeeded = nextLevelXP - currentLevelBaseXP;
    return Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
};

export const RANKS: RankInfo[] = [
    {
        id: 'bronze',
        name: 'Bronze',
        minLevel: 1,
        color: '#cd7f32',
        gradient: 'from-orange-700 to-orange-400',
        icon: Medal
    },
    {
        id: 'silver',
        name: 'Silver',
        minLevel: 10,
        color: '#c0c0c0',
        gradient: 'from-gray-400 to-gray-100',
        icon: Medal
    },
    {
        id: 'gold',
        name: 'Gold',
        minLevel: 30,
        color: '#ffd700',
        gradient: 'from-yellow-600 to-yellow-300',
        icon: Trophy
    },
    {
        id: 'platinum',
        name: 'Platinum',
        minLevel: 50,
        color: '#e5e4e2',
        gradient: 'from-cyan-700 to-cyan-300',
        icon: Crown
    },
    {
        id: 'diamond',
        name: 'Diamond',
        minLevel: 100,
        color: '#b9f2ff',
        gradient: 'from-blue-600 via-indigo-400 to-cyan-300',
        icon: Gem
    }
];

export const getRank = (level: number): RankInfo => {
    // Reverse find to get the highest matching rank
    const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
    return rank || RANKS[0];
};
