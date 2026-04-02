/**
 * Skills Store — Write Actions Only
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store only exposes mutation actions that write to IndexedDB.
 */

import type { Skill, Activity } from '$lib/types';
import { calculateLevel, createDefaultSkill, createActivity } from '$lib/types';
import { SkillTreeEvents } from '@manacore/shared-utils/analytics';
import {
	skillCollection,
	activityCollection,
	type LocalSkill,
	type LocalActivity,
} from '$lib/data/local-store';

// ─── Actions ─────────────────────────────────────────────────

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
	SkillTreeEvents.skillCreated(data.branch || 'custom');
	return skill;
}

async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
	const localUpdates: Partial<LocalSkill> = {};
	if (updates.name !== undefined) localUpdates.name = updates.name;
	if (updates.description !== undefined) localUpdates.description = updates.description;
	if (updates.branch !== undefined) localUpdates.branch = updates.branch;
	if (updates.parentId !== undefined) localUpdates.parentId = updates.parentId;
	if (updates.icon !== undefined) localUpdates.icon = updates.icon;
	if (updates.color !== undefined) localUpdates.color = updates.color;

	await skillCollection.update(id, localUpdates);
}

async function deleteSkill(id: string): Promise<void> {
	// Delete all activities for this skill
	const skillActivities = await activityCollection.getAll({ skillId: id });
	for (const a of skillActivities) {
		await activityCollection.delete(a.id);
	}
	await skillCollection.delete(id);
	SkillTreeEvents.skillDeleted();
}

async function addXp(
	skillId: string,
	xp: number,
	description: string,
	duration?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
	const existing = await skillCollection.getAll({ id: skillId });
	const skill = existing.find((s) => s.id === skillId);
	if (!skill) return { leveledUp: false, newLevel: 0 };

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

	SkillTreeEvents.xpAdded(xp, leveledUp);

	return { leveledUp, newLevel };
}

// Export store (write-only actions)
export const skillStore = {
	addSkill,
	updateSkill,
	deleteSkill,
	addXp,
};
