/**
 * Achievements Store — Local-First with @manacore/local-store
 *
 * All achievement state stored in IndexedDB via Dexie.js.
 * Sync to server happens automatically when authenticated.
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

// Reactive state
let achievements = $state<AchievementWithStatus[]>([]);
let isLoading = $state(true);
let initialized = $state(false);

// Queue of recently unlocked achievements to show celebrations
let unlockQueue = $state<AchievementUnlockResult[]>([]);

// ─── Derived values ──────────────────────────────────────────

const unlockedAchievements = $derived(() => {
	return achievements.filter((a) => a.unlocked);
});

const lockedAchievements = $derived(() => {
	return achievements.filter((a) => !a.unlocked);
});

const achievementsByCategory = $derived(() => {
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
});

const stats = $derived(() => {
	return {
		total: achievements.length,
		unlocked: achievements.filter((a) => a.unlocked).length,
	};
});

const completionPercentage = $derived(() => {
	if (achievements.length === 0) return 0;
	return Math.round((achievements.filter((a) => a.unlocked).length / achievements.length) * 100);
});

// ─── Actions ─────────────────────────────────────────────────

async function initialize() {
	if (initialized) return;

	isLoading = true;
	try {
		const stored = await achievementCollection.getAll();
		if (stored.length === 0) {
			// First time: seed from definitions
			achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
				...def,
				unlocked: false,
				unlockedAt: null,
				progress: 0,
			}));
			// Save each to IndexedDB
			for (const a of achievements) {
				await achievementCollection.insert({
					id: a.id,
					key: a.id,
					name: a.name,
					description: a.description,
					icon: a.icon,
					unlockedAt: '',
				});
			}
		} else {
			// Merge stored data with definitions (in case new achievements were added)
			achievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
				const found = stored.find((s) => s.key === def.id || s.id === def.id);
				return {
					...def,
					unlocked: found?.unlockedAt ? true : false,
					unlockedAt: found?.unlockedAt || null,
					progress: 0,
				};
			});
		}
		initialized = true;
	} catch (error) {
		console.error('Failed to initialize achievements store:', error);
		// Fallback to definitions
		achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
			...def,
			unlocked: false,
			unlockedAt: null,
			progress: 0,
		}));
	} finally {
		isLoading = false;
	}
}

async function reinitialize() {
	initialized = false;
	achievements = [];
	unlockQueue = [];
	await initialize();
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

	for (let i = 0; i < achievements.length; i++) {
		const a = achievements[i];
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
			const unlocked: AchievementWithStatus = {
				...a,
				unlocked: true,
				unlockedAt: new Date().toISOString(),
				progress: condition.threshold,
			};
			achievements = [...achievements.slice(0, i), unlocked, ...achievements.slice(i + 1)];
			await achievementCollection.update(a.id, {
				unlockedAt: unlocked.unlockedAt!,
			});
			newlyUnlocked.push({ achievement: a, xpReward: a.xpReward });
		} else {
			// Update progress
			const updated = { ...a, progress: Math.min(current, condition.threshold) };
			if (updated.progress !== a.progress) {
				achievements = [...achievements.slice(0, i), updated, ...achievements.slice(i + 1)];
			}
		}
	}

	if (newlyUnlocked.length > 0) {
		unlockQueue = [...unlockQueue, ...newlyUnlocked];
	}

	return newlyUnlocked;
}

/**
 * Handle achievements returned from server sync.
 */
function handleApiUnlocks(results: AchievementUnlockResult[]) {
	if (results.length === 0) return;

	for (const result of results) {
		const index = achievements.findIndex((a) => a.id === result.achievement.id);
		if (index !== -1) {
			achievements = [
				...achievements.slice(0, index),
				{
					...achievements[index],
					unlocked: true,
					unlockedAt: new Date().toISOString(),
					progress: achievements[index].condition.threshold,
				},
				...achievements.slice(index + 1),
			];
		}
	}

	unlockQueue = [...unlockQueue, ...results];
}

function popUnlockQueue(): AchievementUnlockResult | null {
	if (unlockQueue.length === 0) return null;
	const [first, ...rest] = unlockQueue;
	unlockQueue = rest;
	return first;
}

export const achievementStore = {
	get achievements() {
		return achievements;
	},
	get isLoading() {
		return isLoading;
	},
	get initialized() {
		return initialized;
	},
	get unlockedAchievements() {
		return unlockedAchievements;
	},
	get lockedAchievements() {
		return lockedAchievements;
	},
	get achievementsByCategory() {
		return achievementsByCategory;
	},
	get stats() {
		return stats;
	},
	get completionPercentage() {
		return completionPercentage;
	},
	get unlockQueue() {
		return unlockQueue;
	},

	initialize,
	reinitialize,
	checkLocal,
	handleApiUnlocks,
	popUnlockQueue,
};
