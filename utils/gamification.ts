
import { Medal, Trophy, Crown, Gem, Star, MessageSquare, Image, Mic, BookOpen, Calculator, Globe, Code } from 'lucide-react';
import { RankInfo, RankTier, UserPlan, DailyQuest, SubjectId } from '../types';

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
    const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
    return rank || RANKS[0];
};

// --- DAILY QUESTS LOGIC ---

// Helper to get icon based on quest type
export const getQuestIcon = (type: string) => {
    switch (type) {
        case 'message': return MessageSquare;
        case 'image': return Image;
        case 'voice': return Mic;
        case SubjectId.MATH: return Calculator;
        case SubjectId.ENGLISH: 
        case SubjectId.GERMAN:
        case SubjectId.FRENCH:
        case SubjectId.SPANISH: return Globe;
        case SubjectId.IT: return Code;
        case SubjectId.HISTORY: return BookOpen;
        default: return Star;
    }
};

const QUEST_TEMPLATES = [
    { desc: 'Изпрати {n} съобщения', type: 'message', min: 3, max: 8, xpPerUnit: 20 },
    { desc: 'Качи {n} снимки', type: 'image', min: 1, max: 3, xpPerUnit: 40 },
    { desc: 'Реши {n} задачи по Математика', type: SubjectId.MATH, min: 2, max: 5, xpPerUnit: 30 },
    { desc: 'Упражнявай Английски ({n} съобщ.)', type: SubjectId.ENGLISH, min: 3, max: 6, xpPerUnit: 20 },
    { desc: 'Научи нещо по История ({n} въпр.)', type: SubjectId.HISTORY, min: 2, max: 4, xpPerUnit: 25 },
    { desc: 'Програмирай с AI ({n} заявки)', type: SubjectId.IT, min: 2, max: 4, xpPerUnit: 30 },
    { desc: 'Гласов разговор ({n} реплики)', type: 'voice', min: 3, max: 10, xpPerUnit: 15 },
];

export const generateDailyQuests = (): DailyQuest[] => {
    // Select 3 random unique templates
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map(t => {
        const target = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
        return {
            id: Math.random().toString(36).substr(2, 9),
            description: t.desc.replace('{n}', target.toString()),
            target: target,
            current: 0,
            xpReward: target * t.xpPerUnit,
            isCompleted: false,
            type: t.type
        };
    });
};

export const updateQuestProgress = (
    quests: DailyQuest[], 
    actionType: 'message' | 'image' | 'voice', 
    subjectId: string, 
    amount: number = 1
): { updatedQuests: DailyQuest[], xpGained: number, completedQuests: string[] } => {
    let xpGained = 0;
    const completedQuests: string[] = [];

    const updatedQuests = quests.map(q => {
        if (q.isCompleted) return q;

        let match = false;
        
        // 1. Generic Type Match (e.g. 'message', 'image')
        if (q.type === actionType) {
            match = true;
        }
        
        // 2. Subject Specific Match
        // We only count messages or voice towards subject specific quests
        if ((actionType === 'message' || actionType === 'voice') && q.type === subjectId) {
            match = true;
        }

        if (match) {
            const newCurrent = Math.min(q.current + amount, q.target);
            const isNowCompleted = newCurrent >= q.target;
            
            // Only reward if it JUST completed
            if (isNowCompleted && q.current < q.target) {
                xpGained += q.xpReward;
                completedQuests.push(q.description);
            }

            return {
                ...q,
                current: newCurrent,
                isCompleted: isNowCompleted
            };
        }
        return q;
    });

    return { updatedQuests, xpGained, completedQuests };
};
