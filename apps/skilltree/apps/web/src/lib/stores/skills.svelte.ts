/**
 * Skills Store — Local-First with @manacore/local-store
 *
 * All reads and writes go to IndexedDB (Dexie.js) first.
 * When authenticated, changes sync to the server in the background.
 */

import type { Skill, Activity, UserStats, SkillBranch } from '$lib/types';
import { calculateLevel, createDefaultSkill, createActivity, BRANCH_INFO } from '$lib/types';
import { SkillTreeEvents } from '@manacore/shared-utils/analytics';
import {
	skillCollection,
	activityCollection,
	type LocalSkill,
	type LocalActivity,
} from '$lib/data/local-store';
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

// ─── Converters ──────────────────────────────────────────────

function toSkill(local: LocalSkill): Skill {
	return {
		id: local.id,
		name: local.name,
		description: local.description,
		branch: local.branch,
		parentId: local.parentId ?? null,
		icon: local.icon,
		color: local.color ?? null,
		currentXp: local.currentXp,
		totalXp: local.totalXp,
		level: local.level,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

function toActivity(local: LocalActivity): Activity {
	return {
		id: local.id,
		skillId: local.skillId,
		xpEarned: local.xpEarned,
		description: local.description,
		duration: local.duration ?? null,
		timestamp: local.timestamp,
	};
}

// ─── Derived values ──────────────────────────────────────────

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

// ─── Actions ─────────────────────────────────────────────────

async function initialize() {
	if (initialized) return;

	isLoading = true;
	try {
		const [localSkills, localActivities] = await Promise.all([
			skillCollection.getAll(),
			activityCollection.getAll(),
		]);
		skills = localSkills.map(toSkill);
		activities = localActivities.map(toActivity);
		recalculateStats();
		initialized = true;
	} catch (error) {
		console.error('Failed to initialize skills store:', error);
	} finally {
		isLoading = false;
	}
}

async function addSkill(data: Partial<Skill>): Promise<Skill> {
	const skill = createDefaultSkill(data);
	const localSkill: LocalSkill = {
		id: skill.id,
		name: skill.name,
		description: skill.description,
		branch: skill.branch,
		parentId: skill.parentId,
		icon: skill.icon,
		color: skill.color,
		currentXp: skill.currentXp,
		totalXp: skill.totalXp,
		level: skill.level,
	};
	await skillCollection.insert(localSkill);
	skills = [...skills, skill];
	SkillTreeEvents.skillCreated(data.branch || 'custom');
	recalculateStats();
	return skill;
}

async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
	const index = skills.findIndex((s) => s.id === id);
	if (index === -1) return;

	const localUpdates: Partial<LocalSkill> = {};
	if (updates.name !== undefined) localUpdates.name = updates.name;
	if (updates.description !== undefined) localUpdates.description = updates.description;
	if (updates.branch !== undefined) localUpdates.branch = updates.branch;
	if (updates.parentId !== undefined) localUpdates.parentId = updates.parentId;
	if (updates.icon !== undefined) localUpdates.icon = updates.icon;
	if (updates.color !== undefined) localUpdates.color = updates.color;

	await skillCollection.update(id, localUpdates);
	const updatedSkill = { ...skills[index], ...updates, updatedAt: new Date().toISOString() };
	skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
	recalculateStats();
}

async function deleteSkill(id: string): Promise<void> {
	// Delete all activities for this skill
	const skillActivities = await activityCollection.getAll({ skillId: id });
	for (const a of skillActivities) {
		await activityCollection.delete(a.id);
	}
	await skillCollection.delete(id);
	skills = skills.filter((s) => s.id !== id);
	activities = activities.filter((a) => a.skillId !== id);
	SkillTreeEvents.skillDeleted();
	recalculateStats();
}

async function addXp(
	skillId: string,
	xp: number,
	description: string,
	duration?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
	const index = skills.findIndex((s) => s.id === skillId);
	if (index === -1) return { leveledUp: false, newLevel: 0 };

	const skill = skills[index];
	const newTotalXp = skill.totalXp + xp;
	const newCurrentXp = skill.currentXp + xp;
	const newLevel = calculateLevel(newTotalXp);
	const leveledUp = newLevel > skill.level;

	await skillCollection.update(skillId, {
		totalXp: newTotalXp,
		currentXp: newCurrentXp,
		level: newLevel,
	});

	const activity = createActivity(skillId, xp, description, duration);
	const localActivity: LocalActivity = {
		id: activity.id,
		skillId: activity.skillId,
		xpEarned: activity.xpEarned,
		description: activity.description,
		duration: activity.duration,
		timestamp: activity.timestamp,
	};
	await activityCollection.insert(localActivity);

	const updatedSkill: Skill = {
		...skill,
		totalXp: newTotalXp,
		currentXp: newCurrentXp,
		level: newLevel,
		updatedAt: new Date().toISOString(),
	};

	skills = [...skills.slice(0, index), updatedSkill, ...skills.slice(index + 1)];
	activities = [...activities, activity];
	SkillTreeEvents.xpAdded(xp, leveledUp);
	recalculateStats();

	return { leveledUp, newLevel };
}

function recalculateStats(): void {
	const sortedActivities = [...activities].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	);

	userStats = {
		totalXp: skills.reduce((sum, s) => sum + s.totalXp, 0),
		totalSkills: skills.length,
		highestLevel: skills.reduce((max, s) => Math.max(max, s.level), 0),
		streakDays: calculateStreak(activities),
		lastActivityDate: sortedActivities.length > 0 ? sortedActivities[0].timestamp : null,
	};
}

function calculateStreak(activityList: Activity[]): number {
	if (activityList.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sortedDates = activityList
		.map((a) => {
			const d = new Date(a.timestamp);
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		})
		.filter((v, i, a) => a.indexOf(v) === i)
		.sort((a, b) => b - a);

	let streak = 0;
	let expectedDate = today.getTime();

	for (const date of sortedDates) {
		if (date === expectedDate || date === expectedDate - 86400000) {
			streak++;
			expectedDate = date - 86400000;
		} else if (date < expectedDate - 86400000) {
			break;
		}
	}

	return streak;
}

function getSkill(id: string): Skill | undefined {
	return skills.find((s) => s.id === id);
}

function getSkillActivities(skillId: string): Activity[] {
	return activities.filter((a) => a.skillId === skillId);
}

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

// Export store
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

	initialize,
	reinitialize,
	addSkill,
	updateSkill,
	deleteSkill,
	addXp,
	getSkill,
	getSkillActivities,
};
