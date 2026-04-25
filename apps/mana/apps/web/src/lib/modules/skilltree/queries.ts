/**
 * Reactive Queries & Pure Helpers for SkillTree
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalSkill, LocalActivity, LocalAchievement } from './types';
import type { Skill, Activity, SkillBranch, UserStats } from './types';
import { BRANCH_INFO } from './types';

// ─── Type Converters ───────────────────────────────────────

export function toSkill(local: LocalSkill): Skill {
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

export function toActivity(local: LocalActivity): Activity {
	return {
		id: local.id,
		skillId: local.skillId,
		xpEarned: local.xpEarned,
		description: local.description,
		duration: local.duration ?? null,
		timestamp: local.timestamp,
	};
}

// ─── Live Queries (call during component init) ─────────────

/** All skills, auto-updates on any change. */
export function useAllSkills() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSkill, string>('skilltree', 'skills').toArray();
		return locals.filter((s) => !s.deletedAt).map(toSkill);
	}, [] as Skill[]);
}

/** All activities, auto-updates on any change. */
export function useAllActivities() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalActivity, string>(
			'skilltree',
			'activities'
		).toArray();
		return locals.filter((a) => !a.deletedAt).map(toActivity);
	}, [] as Activity[]);
}

/** All achievements (raw local records), auto-updates on any change. */
export function useAllAchievements() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalAchievement, string>(
			'skilltree',
			'achievements'
		).toArray();
		return locals.filter((a) => !a.deletedAt);
	}, [] as LocalAchievement[]);
}

// ─── Pure Filter/Helper Functions (for $derived) ──────────

/** Group skills by branch. */
export function groupByBranch(skills: Skill[]): Record<SkillBranch, Skill[]> {
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
}

/** Get top N skills by total XP. */
export function getTopSkills(skills: Skill[], n = 5): Skill[] {
	return [...skills].sort((a, b) => b.totalXp - a.totalXp).slice(0, n);
}

/** Get recent N activities sorted by timestamp descending. */
export function getRecentActivities(activities: Activity[], n = 10): Activity[] {
	return [...activities]
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
		.slice(0, n);
}

/** Compute branch-level stats. */
export function computeBranchStats(
	skills: Skill[]
): Record<SkillBranch, { count: number; totalXp: number; avgLevel: number }> {
	const stats = {} as Record<SkillBranch, { count: number; totalXp: number; avgLevel: number }>;
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
}

/** Calculate activity streak in days. */
export function calculateStreak(activities: Activity[]): number {
	if (activities.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sortedDates = activities
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

/** Compute aggregate user stats from skills and activities. */
export function computeUserStats(skills: Skill[], activities: Activity[]): UserStats {
	const sortedActivities = [...activities].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	);

	return {
		totalXp: skills.reduce((sum, s) => sum + s.totalXp, 0),
		totalSkills: skills.length,
		highestLevel: skills.reduce((max, s) => Math.max(max, s.level), 0),
		streakDays: calculateStreak(activities),
		lastActivityDate: sortedActivities.length > 0 ? sortedActivities[0].timestamp : null,
	};
}

/** Filter skills by branch (or return all if 'all'). */
export function filterByBranch(skills: Skill[], branch: SkillBranch | 'all'): Skill[] {
	if (branch === 'all') return skills;
	return skills.filter((s) => s.branch === branch);
}

/** Find a skill by ID. */
export function getSkillById(skills: Skill[], id: string): Skill | undefined {
	return skills.find((s) => s.id === id);
}

/** Get all activities for a specific skill. */
export function getSkillActivities(activities: Activity[], skillId: string): Activity[] {
	return activities.filter((a) => a.skillId === skillId);
}
