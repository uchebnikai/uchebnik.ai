
import { Medal, Trophy, Crown, Gem, Star } from 'lucide-react';
import { RankInfo, RankTier, UserPlan } from '../types';

// Constants
export const XP_PER_MESSAGE = 20; // Faster feedback loop
export const XP_PER_IMAGE = 40;
export const XP_PER_VOICE = 60;

// Configurable curve constant
// Lower BASE_XP means faster first levels.
const BASE_XP = 50; 
const EXPONENT = 1.55; // Controls how fast the difficulty ramps up

export const PLAN_XP_MULTIPLIERS: Record<UserPlan, number> = {
    free: 1,
    plus: 1.15,
    pro: 1.5
};

export const calculateXPWithBoost = (baseXP: number, plan: UserPlan): number => {
    const multiplier = PLAN_XP_MULTIPLIERS[plan] || 1;
    return Math.floor(baseXP * multiplier);
};

/**
 * Calculates the total XP required to reach a specific level.
 * Formula: XP = BASE * (Level - 1) ^ EXPONENT
 */
export const getMinXPForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return Math.floor(BASE_XP * Math.pow(level - 1, EXPONENT));
};

/**
 * Calculates the current Level based on total XP.
 * Inverse Formula: Level = (XP / BASE)^(1/EXPONENT) + 1
 */
export const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / BASE_XP, 1 / EXPONENT)) + 1;
};

/**
 * Returns stats for the progress bar.
 */
export const getLevelStats = (totalXP: number, currentLevel: number) => {
    const startXP = getMinXPForLevel(currentLevel);
    const endXP = getMinXPForLevel(currentLevel + 1);
    
    // XP gained specifically within this level
    const currentLevelProgress = totalXP - startXP;
    // XP needed to complete this level
    const xpNeededForNext = endXP - startXP;
    
    // Percentage 0-100
    const percentage = Math.min(100, Math.max(0, (currentLevelProgress / xpNeededForNext) * 100));

    return {
        currentLevelProgress, // e.g. 40
        xpNeededForNext,      // e.g. 100
        percentage,           // e.g. 40%
        startXP,
        endXP
    };
};

// Deprecated wrapper to maintain compatibility if used elsewhere, 
// but preferred to use getLevelStats for UI
export const getLevelProgress = (xp: number, level: number): number => {
    return getLevelStats(xp, level).percentage;
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
        color: '#9ca3af',
        gradient: 'from-gray-400 to-gray-200',
        icon: Medal
    },
    {
        id: 'gold',
        name: 'Gold',
        minLevel: 25,
        color: '#fbbf24',
        gradient: 'from-yellow-600 to-yellow-300',
        icon: Trophy
    },
    {
        id: 'platinum',
        name: 'Platinum',
        minLevel: 50,
        color: '#38bdf8',
        gradient: 'from-cyan-600 to-cyan-300',
        icon: Crown
    },
    {
        id: 'diamond',
        name: 'Diamond',
        minLevel: 100,
        color: '#818cf8',
        gradient: 'from-indigo-600 via-purple-500 to-pink-400',
        icon: Gem
    }
];

export const getRank = (level: number): RankInfo => {
    // Reverse find to get the highest matching rank
    const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
    return rank || RANKS[0];
};
