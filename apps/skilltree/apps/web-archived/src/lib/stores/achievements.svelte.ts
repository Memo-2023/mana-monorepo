/**
 * Achievements Store — Write Actions + Unlock Queue
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store handles achievement checking logic and the unlock celebration queue.
 */

import type {
	AchievementWithStatus,
	AchievementUnlockResult,
	AchievementCategory,
	Skill,
	Activity,
	UserStats,
} from '$lib/types';
import { ACHIEVEMENT_DEFINITIONS } from '$lib/types';
import { achievementCollection, type LocalAchievement } from '$lib/data/local-store';

// Queue of recently unlocked achievements to show celebrations
let unlockQueue = $state<AchievementUnlockResult[]>([]);

// ─── Derived helpers (pure functions for consumers) ──────────

/** Build achievement status list from stored records and definitions. */
export function buildAchievementStatus(stored: LocalAchievement[]): AchievementWithStatus[] {
	if (stored.length === 0) {
		return ACHIEVEMENT_DEFINITIONS.map((def) => ({
			...def,
			unlocked: false,
			unlockedAt: null,
			progress: 0,
		}));
	}
	return ACHIEVEMENT_DEFINITIONS.map((def) => {
		const found = stored.find((s) => s.key === def.id || s.id === def.id);
		return {
			...def,
			unlocked: found?.unlockedAt ? true : false,
			unlockedAt: found?.unlockedAt || null,
			progress: 0,
		};
	});
}

export function getUnlockedAchievements(
	achievements: AchievementWithStatus[]
): AchievementWithStatus[] {
	return achievements.filter((a) => a.unlocked);
}

export function getLockedAchievements(
	achievements: AchievementWithStatus[]
): AchievementWithStatus[] {
	return achievements.filter((a) => !a.unlocked);
}

export function getAchievementsByCategory(
	achievements: AchievementWithStatus[]
): Record<AchievementCategory, AchievementWithStatus[]> {
	const grouped: Record<AchievementCategory, AchievementWithStatus[]> = {
		xp: [],
		skills: [],
		levels: [],
		activities: [],
		streak: [],
		branches: [],
		special: [],
	};
	for (const a of achievements) {
		grouped[a.category].push(a);
	}
	return grouped;
}

export function getAchievementStats(achievements: AchievementWithStatus[]): {
	total: number;
	unlocked: number;
} {
	return {
		total: achievements.length,
		unlocked: achievements.filter((a) => a.unlocked).length,
	};
}

export function getCompletionPercentage(achievements: AchievementWithStatus[]): number {
	if (achievements.length === 0) return 0;
	return Math.round((achievements.filter((a) => a.unlocked).length / achievements.length) * 100);
}

// ─── Actions ─────────────────────────────────────────────────

async function seedIfEmpty() {
	const stored = await achievementCollection.getAll();
	if (stored.length === 0) {
		for (const def of ACHIEVEMENT_DEFINITIONS) {
			await achievementCollection.insert({
				id: def.id,
				key: def.id,
				name: def.name,
				description: def.description,
				icon: def.icon,
				unlockedAt: '',
			});
		}
	}
}

/**
 * Check achievements locally (offline mode).
 * Called after skill/activity changes.
 */
async function checkLocal(context: {
	skills: Skill[];
	activities: Activity[];
	userStats: UserStats;
	lastActivityXp?: number;
}): Promise<AchievementUnlockResult[]> {
	const { skills, activities: allActivities, userStats: stats, lastActivityXp } = context;

	// Get current achievements from DB
	const stored = await achievementCollection.getAll();
	const achievements = buildAchievementStatus(stored);

	const uniqueBranches = new Set(skills.map((s) => s.branch).filter((b) => b !== 'custom'));

	const mainBranches = ['intellect', 'body', 'creativity', 'social', 'practical', 'mindset'];
	const branchMaxLevels = new Map<string, number>();
	for (const branch of mainBranches) {
		const branchSkills = skills.filter((s) => s.branch === branch);
		if (branchSkills.length > 0) {
			branchMaxLevels.set(branch, Math.max(...branchSkills.map((s) => s.level)));
		}
	}
	const allBranchesMinLevel =
		branchMaxLevels.size === 6 ? Math.min(...branchMaxLevels.values()) : 0;

	const userData = {
		totalXp: stats.totalXp,
		totalSkills: skills.length,
		highestLevel: stats.highestLevel,
		totalActivities: allActivities.length,
		streakDays: stats.streakDays,
		uniqueBranches: uniqueBranches.size,
		allBranchesMinLevel,
		lastActivityXp: lastActivityXp ?? 0,
	};

	const newlyUnlocked: AchievementUnlockResult[] = [];

	for (const a of achievements) {
		if (a.unlocked) continue;

		const condition = a.condition;
		let current = 0;
		let met = false;

		switch (condition.type) {
			case 'total_xp':
				current = userData.totalXp;
				met = current >= condition.threshold;
				break;
			case 'total_skills':
				current = userData.totalSkills;
				met = current >= condition.threshold;
				break;
			case 'highest_level':
				current = userData.highestLevel;
				met = current >= condition.threshold;
				break;
			case 'total_activities':
				current = userData.totalActivities;
				met = current >= condition.threshold;
				break;
			case 'streak_days':
				current = userData.streakDays;
				met = current >= condition.threshold;
				break;
			case 'unique_branches':
				current = userData.uniqueBranches;
				met = current >= condition.threshold;
				break;
			case 'single_activity_xp':
				current = userData.lastActivityXp;
				met = current >= condition.threshold;
				break;
			case 'all_branches_min_level':
				current = userData.allBranchesMinLevel;
				met = current >= condition.threshold;
				break;
		}

		if (met) {
			await achievementCollection.update(a.id, {
				unlockedAt: new Date().toISOString(),
			});
			newlyUnlocked.push({ achievement: a, xpReward: a.xpReward });
		}
	}

	if (newlyUnlocked.length > 0) {
		unlockQueue = [...unlockQueue, ...newlyUnlocked];
	}

	return newlyUnlocked;
}

function popUnlockQueue(): AchievementUnlockResult | null {
	if (unlockQueue.length === 0) return null;
	const [first, ...rest] = unlockQueue;
	unlockQueue = rest;
	return first;
}

export const achievementStore = {
	get unlockQueue() {
		return unlockQueue;
	},

	seedIfEmpty,
	checkLocal,
	popUnlockQueue,
};
