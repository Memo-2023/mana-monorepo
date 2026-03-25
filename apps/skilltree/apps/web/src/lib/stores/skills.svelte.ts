import type { Skill, Activity, UserStats, SkillBranch, AchievementUnlockResult } from '$lib/types';
import { calculateLevel, createDefaultSkill, createActivity, BRANCH_INFO } from '$lib/types';
import { SkillTreeEvents } from '@manacore/shared-utils/analytics';
import * as storage from '$lib/services/storage';
import * as skillsApi from '$lib/api/skills';
import * as activitiesApi from '$lib/api/activities';
import { authStore } from './auth.svelte';
import { achievementStore } from './achievements.svelte';

// Reactive state using Svelte 5 runes
let skills = $state<Skill[]>([]);
let activities = $state<Activity[]>([]);
let userStats = $state<UserStats>({
	totalXp: 0,
	totalSkills: 0,
	highestLevel: 0,
	streakDays: 0,
	lastActivityDate: null,
});
let isLoading = $state(true);
let initialized = $state(false);
let useApi = $state(false);

// Derived values
const skillsByBranch = $derived(() => {
	const grouped: Record<SkillBranch, Skill[]> = {
		intellect: [],
		body: [],
		creativity: [],
		social: [],
		practical: [],
		mindset: [],
		custom: [],
	};
	for (const skill of skills) {
		grouped[skill.branch].push(skill);
	}
	return grouped;
});

const topSkills = $derived(() => {
	return [...skills].sort((a, b) => b.totalXp - a.totalXp).slice(0, 5);
});

const recentActivities = $derived(() => {
	return [...activities]
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
		.slice(0, 10);
});

const branchStats = $derived(() => {
	const stats: Record<SkillBranch, { count: number; totalXp: number; avgLevel: number }> =
		{} as Record<SkillBranch, { count: number; totalXp: number; avgLevel: number }>;
	for (const branch of Object.keys(BRANCH_INFO) as SkillBranch[]) {
		const branchSkills = skills.filter((s) => s.branch === branch);
		stats[branch] = {
			count: branchSkills.length,
			totalXp: branchSkills.reduce((sum, s) => sum + s.totalXp, 0),
			avgLevel:
				branchSkills.length > 0
					? branchSkills.reduce((sum, s) => sum + s.level, 0) / branchSkills.length
					: 0,
		};
	}
	return stats;
});

// Actions
async function initialize() {
	if (initialized) return;

	isLoading = true;
	try {
		// Check if user is authenticated
		if (authStore.isAuthenticated) {
			useApi = true;
			const [loadedSkills, loadedActivities, loadedStats] = await Promise.all([
				skillsApi.getSkills(),
				activitiesApi.getRecentActivities(50),
				skillsApi.getStats(),
			]);
			skills = loadedSkills;
			activities = loadedActivities;
			userStats = loadedStats;
		} else {
			// Fallback to IndexedDB for offline/unauthenticated use
			useApi = false;
			const [loadedSkills, loadedActivities, loadedStats] = await Promise.all([
				storage.getAllSkills(),
				storage.getAllActivities(),
				storage.getUserStats(),
			]);
			skills = loadedSkills;
			activities = loadedActivities;
			userStats = loadedStats;
		}
		initialized = true;
	} catch (error) {
		console.error('Failed to initialize skills store:', error);
		// On error, try IndexedDB as fallback
		if (useApi) {
			try {
				useApi = false;
				const [loadedSkills, loadedActivities, loadedStats] = await Promise.all([
					storage.getAllSkills(),
					storage.getAllActivities(),
					storage.getUserStats(),
				]);
				skills = loadedSkills;
				activities = loadedActivities;
				userStats = loadedStats;
			} catch (fallbackError) {
				console.error('Fallback to IndexedDB also failed:', fallbackError);
			}
		}
	} finally {
		isLoading = false;
	}
}

async function addSkill(data: Partial<Skill>): Promise<Skill> {
	if (useApi && authStore.isAuthenticated) {
		const result = await skillsApi.createSkill({
			name: data.name || '',
			description: data.description,
			branch: data.branch || 'custom',
			parentId: data.parentId ?? undefined,
			icon: data.icon,
			color: data.color ?? undefined,
		});
		skills = [...skills, result.skill];
		SkillTreeEvents.skillCreated(data.branch || 'custom');
		await updateStats();
		if (result.newAchievements?.length > 0) {
			achievementStore.handleApiUnlocks(result.newAchievements);
		}
		return result.skill;
	} else {
		const skill = createDefaultSkill(data);
		await storage.saveSkill(skill);
		skills = [...skills, skill];
		SkillTreeEvents.skillCreated(data.branch || 'custom');
		await updateStats();
		return skill;
	}
}

async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
	const index = skills.findIndex((s) => s.id === id);
	if (index === -1) return;

	if (useApi && authStore.isAuthenticated) {
		const skill = await skillsApi.updateSkill(id, {
			name: updates.name,
			description: updates.description,
			branch: updates.branch,
			parentId: updates.parentId,
			icon: updates.icon,
			color: updates.color,
		});
		skills = [...skills.slice(0, index), skill, ...skills.slice(index + 1)];
	} else {
		const updatedSkill = { ...skills[index], ...updates, updatedAt: new Date().toISOString() };
		await storage.saveSkill(updatedSkill);
		skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
	}
	await updateStats();
}

async function deleteSkill(id: string): Promise<void> {
	if (useApi && authStore.isAuthenticated) {
		await skillsApi.deleteSkill(id);
	} else {
		await storage.deleteSkill(id);
	}
	skills = skills.filter((s) => s.id !== id);
	SkillTreeEvents.skillDeleted();
	activities = activities.filter((a) => a.skillId !== id);
	await updateStats();
}

async function addXp(
	skillId: string,
	xp: number,
	description: string,
	duration?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
	const index = skills.findIndex((s) => s.id === skillId);
	if (index === -1) return { leveledUp: false, newLevel: 0 };

	if (useApi && authStore.isAuthenticated) {
		const result = await skillsApi.addXp(skillId, { xp, description, duration });
		skills = [...skills.slice(0, index), result.skill, ...skills.slice(index + 1)];
		activities = [...activities, result.activity];
		SkillTreeEvents.xpAdded(xp, result.leveledUp);
		await updateStats();
		if (result.newAchievements?.length > 0) {
			achievementStore.handleApiUnlocks(result.newAchievements);
		}
		return { leveledUp: result.leveledUp, newLevel: result.newLevel };
	} else {
		const skill = skills[index];
		const newTotalXp = skill.totalXp + xp;
		const newCurrentXp = skill.currentXp + xp;
		const newLevel = calculateLevel(newTotalXp);
		const leveledUp = newLevel > skill.level;

		const updatedSkill: Skill = {
			...skill,
			totalXp: newTotalXp,
			currentXp: newCurrentXp,
			level: newLevel,
			updatedAt: new Date().toISOString(),
		};

		const activity = createActivity(skillId, xp, description, duration);

		await Promise.all([storage.saveSkill(updatedSkill), storage.saveActivity(activity)]);

		skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
		activities = [...activities, activity];
		await updateStats();

		return { leveledUp, newLevel };
	}
}

async function updateStats(): Promise<void> {
	if (useApi && authStore.isAuthenticated) {
		try {
			userStats = await skillsApi.getStats();
		} catch {
			// Calculate locally as fallback
			userStats = calculateLocalStats();
		}
	} else {
		userStats = await storage.recalculateStats();
	}
}

function calculateLocalStats(): UserStats {
	return {
		totalXp: skills.reduce((sum, s) => sum + s.totalXp, 0),
		totalSkills: skills.length,
		highestLevel: skills.reduce((max, s) => Math.max(max, s.level), 0),
		streakDays: 0,
		lastActivityDate: activities.length > 0 ? activities[activities.length - 1].timestamp : null,
	};
}

function getSkill(id: string): Skill | undefined {
	return skills.find((s) => s.id === id);
}

function getSkillActivities(skillId: string): Activity[] {
	return activities.filter((a) => a.skillId === skillId);
}

// Reinitialize when auth state changes
async function reinitialize() {
	initialized = false;
	skills = [];
	activities = [];
	userStats = {
		totalXp: 0,
		totalSkills: 0,
		highestLevel: 0,
		streakDays: 0,
		lastActivityDate: null,
	};
	await initialize();
}

// Export store as object with getters for reactive access
export const skillStore = {
	get skills() {
		return skills;
	},
	get activities() {
		return activities;
	},
	get userStats() {
		return userStats;
	},
	get isLoading() {
		return isLoading;
	},
	get initialized() {
		return initialized;
	},
	get skillsByBranch() {
		return skillsByBranch;
	},
	get topSkills() {
		return topSkills;
	},
	get recentActivities() {
		return recentActivities;
	},
	get branchStats() {
		return branchStats;
	},
	get useApi() {
		return useApi;
	},

	initialize,
	reinitialize,
	addSkill,
	updateSkill,
	deleteSkill,
	addXp,
	getSkill,
	getSkillActivities,
};
