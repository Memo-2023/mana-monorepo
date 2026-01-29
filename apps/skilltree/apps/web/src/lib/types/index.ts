// Skill Tree Types

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

// Level thresholds (XP needed for each level)
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

// Helper functions
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
