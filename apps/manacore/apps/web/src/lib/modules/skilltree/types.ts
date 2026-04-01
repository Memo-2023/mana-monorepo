/**
 * SkillTree module types for the unified ManaCore app.
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Local Record Types (IndexedDB) ──────────────────────

export interface LocalSkill extends BaseRecord {
	name: string;
	description: string;
	branch: 'intellect' | 'body' | 'creativity' | 'social' | 'practical' | 'mindset' | 'custom';
	parentId?: string | null;
	icon: string;
	color?: string | null;
	currentXp: number;
	totalXp: number;
	level: number;
}

export interface LocalActivity extends BaseRecord {
	skillId: string;
	xpEarned: number;
	description: string;
	duration?: number | null;
	timestamp: string;
}

export interface LocalAchievement extends BaseRecord {
	key: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt: string;
}

// ─── Domain Types ─────────────────────────────────────────

export type SkillBranch =
	| 'intellect'
	| 'body'
	| 'creativity'
	| 'social'
	| 'practical'
	| 'mindset'
	| 'custom';

export interface Skill {
	id: string;
	name: string;
	description: string;
	branch: SkillBranch;
	parentId: string | null;
	icon: string;
	color: string | null;
	currentXp: number;
	totalXp: number;
	level: number;
	createdAt: string;
	updatedAt: string;
}

export interface Activity {
	id: string;
	skillId: string;
	xpEarned: number;
	description: string;
	duration: number | null; // minutes
	timestamp: string;
}

export interface UserStats {
	totalXp: number;
	totalSkills: number;
	highestLevel: number;
	streakDays: number;
	lastActivityDate: string | null;
}

// ─── Level System ─────────────────────────────────────────

export const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 4000, 10000] as const;

export const LEVEL_NAMES = [
	'Unbekannt',
	'Anfänger',
	'Fortgeschritten',
	'Kompetent',
	'Experte',
	'Meister',
] as const;

export const BRANCH_INFO: Record<
	SkillBranch,
	{ name: string; icon: string; color: string; description: string }
> = {
	intellect: {
		name: 'Intellekt',
		icon: 'brain',
		color: 'var(--color-branch-intellect)',
		description: 'Wissen, Sprachen, Wissenschaft',
	},
	body: {
		name: 'Körper',
		icon: 'dumbbell',
		color: 'var(--color-branch-body)',
		description: 'Fitness, Sport, Gesundheit',
	},
	creativity: {
		name: 'Kreativität',
		icon: 'palette',
		color: 'var(--color-branch-creativity)',
		description: 'Kunst, Musik, Schreiben',
	},
	social: {
		name: 'Sozial',
		icon: 'users',
		color: 'var(--color-branch-social)',
		description: 'Kommunikation, Leadership, Empathie',
	},
	practical: {
		name: 'Praktisch',
		icon: 'wrench',
		color: 'var(--color-branch-practical)',
		description: 'Handwerk, Kochen, Technologie',
	},
	mindset: {
		name: 'Mindset',
		icon: 'heart',
		color: 'var(--color-branch-mindset)',
		description: 'Meditation, Fokus, Resilienz',
	},
	custom: {
		name: 'Eigene',
		icon: 'star',
		color: 'var(--color-primary)',
		description: 'Eigene Kategorien',
	},
};

// ─── Helper Functions ─────────────────────────────────────

export function calculateLevel(xp: number): number {
	for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
		if (xp >= LEVEL_THRESHOLDS[i]) {
			return i;
		}
	}
	return 0;
}

export function xpForNextLevel(currentLevel: number): number {
	if (currentLevel >= LEVEL_THRESHOLDS.length - 1) {
		return Infinity;
	}
	return LEVEL_THRESHOLDS[currentLevel + 1];
}

export function xpProgress(xp: number, level: number): number {
	if (level >= LEVEL_THRESHOLDS.length - 1) {
		return 100;
	}
	const currentThreshold = LEVEL_THRESHOLDS[level];
	const nextThreshold = LEVEL_THRESHOLDS[level + 1];
	const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
	return Math.min(100, Math.max(0, progress));
}

export function createDefaultSkill(partial: Partial<Skill> = {}): Skill {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name: '',
		description: '',
		branch: 'custom',
		parentId: null,
		icon: 'star',
		color: null,
		currentXp: 0,
		totalXp: 0,
		level: 0,
		createdAt: now,
		updatedAt: now,
		...partial,
	};
}

export function createActivity(
	skillId: string,
	xpEarned: number,
	description: string,
	duration?: number
): Activity {
	return {
		id: crypto.randomUUID(),
		skillId,
		xpEarned,
		description,
		duration: duration ?? null,
		timestamp: new Date().toISOString(),
	};
}

// ─── Achievement Types ────────────────────────────────────

export type AchievementCategory =
	| 'xp'
	| 'skills'
	| 'levels'
	| 'activities'
	| 'streak'
	| 'branches'
	| 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementCondition {
	type: string;
	threshold: number;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: AchievementCategory;
	rarity: AchievementRarity;
	xpReward: number;
	sortOrder: number;
	condition: AchievementCondition;
}

export interface AchievementWithStatus extends Achievement {
	unlocked: boolean;
	unlockedAt: string | null;
	progress: number;
}

export interface AchievementUnlockResult {
	achievement: Achievement;
	xpReward: number;
}

export const RARITY_INFO: Record<
	AchievementRarity,
	{ name: string; color: string; bgColor: string; borderColor: string }
> = {
	common: {
		name: 'Gewöhnlich',
		color: 'text-gray-300',
		bgColor: 'bg-gray-700/50',
		borderColor: 'border-gray-600',
	},
	uncommon: {
		name: 'Ungewöhnlich',
		color: 'text-green-400',
		bgColor: 'bg-green-900/30',
		borderColor: 'border-green-700',
	},
	rare: {
		name: 'Selten',
		color: 'text-blue-400',
		bgColor: 'bg-blue-900/30',
		borderColor: 'border-blue-700',
	},
	epic: {
		name: 'Episch',
		color: 'text-purple-400',
		bgColor: 'bg-purple-900/30',
		borderColor: 'border-purple-700',
	},
	legendary: {
		name: 'Legendär',
		color: 'text-yellow-400',
		bgColor: 'bg-yellow-900/30',
		borderColor: 'border-yellow-600',
	},
};

export const ACHIEVEMENT_CATEGORY_INFO: Record<
	AchievementCategory,
	{ name: string; icon: string }
> = {
	xp: { name: 'Erfahrung', icon: 'star' },
	skills: { name: 'Skills', icon: 'grid' },
	levels: { name: 'Level', icon: 'arrow-up' },
	activities: { name: 'Aktivitäten', icon: 'lightning' },
	streak: { name: 'Streak', icon: 'flame' },
	branches: { name: 'Branches', icon: 'compass' },
	special: { name: 'Speziell', icon: 'trophy' },
};

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
	// XP
	{
		id: 'xp_100',
		name: 'Erste Schritte',
		description: 'Sammle 100 XP insgesamt',
		icon: 'star',
		category: 'xp',
		rarity: 'common',
		xpReward: 10,
		sortOrder: 1,
		condition: { type: 'total_xp', threshold: 100 },
	},
	{
		id: 'xp_1000',
		name: 'Tausender-Club',
		description: 'Sammle 1.000 XP insgesamt',
		icon: 'star',
		category: 'xp',
		rarity: 'uncommon',
		xpReward: 25,
		sortOrder: 2,
		condition: { type: 'total_xp', threshold: 1000 },
	},
	{
		id: 'xp_5000',
		name: 'XP-Sammler',
		description: 'Sammle 5.000 XP insgesamt',
		icon: 'star',
		category: 'xp',
		rarity: 'rare',
		xpReward: 50,
		sortOrder: 3,
		condition: { type: 'total_xp', threshold: 5000 },
	},
	{
		id: 'xp_10000',
		name: 'XP-Legende',
		description: 'Sammle 10.000 XP insgesamt',
		icon: 'crown',
		category: 'xp',
		rarity: 'epic',
		xpReward: 100,
		sortOrder: 4,
		condition: { type: 'total_xp', threshold: 10000 },
	},
	{
		id: 'xp_50000',
		name: 'Grenzenlos',
		description: 'Sammle 50.000 XP insgesamt',
		icon: 'crown',
		category: 'xp',
		rarity: 'legendary',
		xpReward: 250,
		sortOrder: 5,
		condition: { type: 'total_xp', threshold: 50000 },
	},
	// Skills
	{
		id: 'skills_1',
		name: 'Der Anfang',
		description: 'Erstelle deinen ersten Skill',
		icon: 'plus',
		category: 'skills',
		rarity: 'common',
		xpReward: 10,
		sortOrder: 10,
		condition: { type: 'total_skills', threshold: 1 },
	},
	{
		id: 'skills_5',
		name: 'Vielseitig',
		description: 'Erstelle 5 Skills',
		icon: 'grid',
		category: 'skills',
		rarity: 'uncommon',
		xpReward: 25,
		sortOrder: 11,
		condition: { type: 'total_skills', threshold: 5 },
	},
	{
		id: 'skills_10',
		name: 'Skill-Sammler',
		description: 'Erstelle 10 Skills',
		icon: 'grid',
		category: 'skills',
		rarity: 'rare',
		xpReward: 50,
		sortOrder: 12,
		condition: { type: 'total_skills', threshold: 10 },
	},
	{
		id: 'skills_20',
		name: 'Meister aller Klassen',
		description: 'Erstelle 20 Skills',
		icon: 'grid',
		category: 'skills',
		rarity: 'epic',
		xpReward: 100,
		sortOrder: 13,
		condition: { type: 'total_skills', threshold: 20 },
	},
	// Levels
	{
		id: 'level_1',
		name: 'Anfänger',
		description: 'Erreiche Level 1 mit einem Skill',
		icon: 'arrow-up',
		category: 'levels',
		rarity: 'common',
		xpReward: 15,
		sortOrder: 20,
		condition: { type: 'highest_level', threshold: 1 },
	},
	{
		id: 'level_3',
		name: 'Kompetent',
		description: 'Erreiche Level 3 mit einem Skill',
		icon: 'arrow-up',
		category: 'levels',
		rarity: 'rare',
		xpReward: 50,
		sortOrder: 21,
		condition: { type: 'highest_level', threshold: 3 },
	},
	{
		id: 'level_5',
		name: 'Meister',
		description: 'Erreiche Level 5 mit einem Skill',
		icon: 'crown',
		category: 'levels',
		rarity: 'legendary',
		xpReward: 200,
		sortOrder: 22,
		condition: { type: 'highest_level', threshold: 5 },
	},
	// Activities
	{
		id: 'activities_1',
		name: 'Erste Aktion',
		description: 'Logge deine erste Aktivität',
		icon: 'lightning',
		category: 'activities',
		rarity: 'common',
		xpReward: 5,
		sortOrder: 30,
		condition: { type: 'total_activities', threshold: 1 },
	},
	{
		id: 'activities_10',
		name: 'Dranbleiber',
		description: 'Logge 10 Aktivitäten',
		icon: 'lightning',
		category: 'activities',
		rarity: 'uncommon',
		xpReward: 20,
		sortOrder: 31,
		condition: { type: 'total_activities', threshold: 10 },
	},
	{
		id: 'activities_50',
		name: 'Fleißig',
		description: 'Logge 50 Aktivitäten',
		icon: 'lightning',
		category: 'activities',
		rarity: 'rare',
		xpReward: 50,
		sortOrder: 32,
		condition: { type: 'total_activities', threshold: 50 },
	},
	{
		id: 'activities_100',
		name: 'Unaufhaltsam',
		description: 'Logge 100 Aktivitäten',
		icon: 'fire',
		category: 'activities',
		rarity: 'epic',
		xpReward: 100,
		sortOrder: 33,
		condition: { type: 'total_activities', threshold: 100 },
	},
	{
		id: 'activities_500',
		name: 'Maschine',
		description: 'Logge 500 Aktivitäten',
		icon: 'fire',
		category: 'activities',
		rarity: 'legendary',
		xpReward: 250,
		sortOrder: 34,
		condition: { type: 'total_activities', threshold: 500 },
	},
	// Streak
	{
		id: 'streak_3',
		name: '3-Tage-Streak',
		description: 'Halte einen 3-Tage-Streak',
		icon: 'flame',
		category: 'streak',
		rarity: 'common',
		xpReward: 15,
		sortOrder: 40,
		condition: { type: 'streak_days', threshold: 3 },
	},
	{
		id: 'streak_7',
		name: 'Wochenkrieger',
		description: 'Halte einen 7-Tage-Streak',
		icon: 'flame',
		category: 'streak',
		rarity: 'uncommon',
		xpReward: 30,
		sortOrder: 41,
		condition: { type: 'streak_days', threshold: 7 },
	},
	{
		id: 'streak_14',
		name: 'Zwei-Wochen-Held',
		description: 'Halte einen 14-Tage-Streak',
		icon: 'flame',
		category: 'streak',
		rarity: 'rare',
		xpReward: 75,
		sortOrder: 42,
		condition: { type: 'streak_days', threshold: 14 },
	},
	{
		id: 'streak_30',
		name: 'Monatsmeister',
		description: 'Halte einen 30-Tage-Streak',
		icon: 'flame',
		category: 'streak',
		rarity: 'epic',
		xpReward: 150,
		sortOrder: 43,
		condition: { type: 'streak_days', threshold: 30 },
	},
	{
		id: 'streak_100',
		name: 'Hundert Tage',
		description: 'Halte einen 100-Tage-Streak',
		icon: 'flame',
		category: 'streak',
		rarity: 'legendary',
		xpReward: 500,
		sortOrder: 44,
		condition: { type: 'streak_days', threshold: 100 },
	},
	// Branches
	{
		id: 'branches_3',
		name: 'Entdecker',
		description: 'Habe Skills in 3 verschiedenen Branches',
		icon: 'compass',
		category: 'branches',
		rarity: 'uncommon',
		xpReward: 25,
		sortOrder: 50,
		condition: { type: 'unique_branches', threshold: 3 },
	},
	{
		id: 'branches_all',
		name: 'Universalgelehrter',
		description: 'Habe Skills in allen 6 Branches',
		icon: 'compass',
		category: 'branches',
		rarity: 'epic',
		xpReward: 100,
		sortOrder: 51,
		condition: { type: 'unique_branches', threshold: 6 },
	},
	// Special
	{
		id: 'single_xp_100',
		name: 'Mammut-Session',
		description: 'Verdiene 100+ XP in einer einzelnen Aktivität',
		icon: 'zap',
		category: 'special',
		rarity: 'rare',
		xpReward: 25,
		sortOrder: 60,
		condition: { type: 'single_activity_xp', threshold: 100 },
	},
	{
		id: 'all_branches_level_1',
		name: 'Allrounder',
		description: 'Erreiche Level 1 in allen 6 Branches',
		icon: 'shield',
		category: 'special',
		rarity: 'epic',
		xpReward: 150,
		sortOrder: 61,
		condition: { type: 'all_branches_min_level', threshold: 1 },
	},
];
