import type { Skill, Activity, UserStats, SkillBranch } from '$lib/types';
import {
	calculateLevel,
	createDefaultSkill,
	createActivity,
	BRANCH_INFO,
} from '$lib/types';
import * as storage from '$lib/services/storage';

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
	return [...activities].sort((a, b) =>
		new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	).slice(0, 10);
});

const branchStats = $derived(() => {
	const stats: Record<SkillBranch, { count: number; totalXp: number; avgLevel: number }> = {} as any;
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
		const [loadedSkills, loadedActivities, loadedStats] = await Promise.all([
			storage.getAllSkills(),
			storage.getAllActivities(),
			storage.getUserStats(),
		]);
		skills = loadedSkills;
		activities = loadedActivities;
		userStats = loadedStats;
		initialized = true;
	} catch (error) {
		console.error('Failed to initialize skills store:', error);
	} finally {
		isLoading = false;
	}
}

async function addSkill(data: Partial<Skill>): Promise<Skill> {
	const skill = createDefaultSkill(data);
	await storage.saveSkill(skill);
	skills = [...skills, skill];
	await updateStats();
	return skill;
}

async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
	const index = skills.findIndex((s) => s.id === id);
	if (index === -1) return;

	const updatedSkill = { ...skills[index], ...updates, updatedAt: new Date().toISOString() };
	await storage.saveSkill(updatedSkill);
	skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
	await updateStats();
}

async function deleteSkill(id: string): Promise<void> {
	await storage.deleteSkill(id);
	skills = skills.filter((s) => s.id !== id);
	activities = activities.filter((a) => a.skillId !== id);
	await updateStats();
}

async function addXp(skillId: string, xp: number, description: string, duration?: number): Promise<{ leveledUp: boolean; newLevel: number }> {
	const index = skills.findIndex((s) => s.id === skillId);
	if (index === -1) return { leveledUp: false, newLevel: 0 };

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

	await Promise.all([
		storage.saveSkill(updatedSkill),
		storage.saveActivity(activity),
	]);

	skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
	activities = [...activities, activity];
	await updateStats();

	return { leveledUp, newLevel };
}

async function updateStats(): Promise<void> {
	userStats = await storage.recalculateStats();
}

function getSkill(id: string): Skill | undefined {
	return skills.find((s) => s.id === id);
}

function getSkillActivities(skillId: string): Activity[] {
	return activities.filter((a) => a.skillId === skillId);
}

// Export store as object with getters for reactive access
export const skillStore = {
	get skills() { return skills; },
	get activities() { return activities; },
	get userStats() { return userStats; },
	get isLoading() { return isLoading; },
	get initialized() { return initialized; },
	get skillsByBranch() { return skillsByBranch; },
	get topSkills() { return topSkills; },
	get recentActivities() { return recentActivities; },
	get branchStats() { return branchStats; },

	initialize,
	addSkill,
	updateSkill,
	deleteSkill,
	addXp,
	getSkill,
	getSkillActivities,
};
