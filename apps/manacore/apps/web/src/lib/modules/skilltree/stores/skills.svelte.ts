/**
 * Skills Store — Write Actions Only
 *
 * Reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutation actions that write to IndexedDB.
 */

import { db } from '$lib/data/database';
import type { Skill } from '../types';
import { calculateLevel, createDefaultSkill, createActivity } from '../types';
import type { LocalSkill, LocalActivity } from '../types';
import { SkillTreeEvents } from '@manacore/shared-utils/analytics';

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
	await db.table<LocalSkill>('skills').add({
		...localSkill,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
	SkillTreeEvents.skillCreated(data.branch || 'custom');
	return skill;
}

async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
	const localUpdates: Partial<LocalSkill> & { updatedAt: string } = {
		updatedAt: new Date().toISOString(),
	};
	if (updates.name !== undefined) localUpdates.name = updates.name;
	if (updates.description !== undefined) localUpdates.description = updates.description;
	if (updates.branch !== undefined) localUpdates.branch = updates.branch;
	if (updates.parentId !== undefined) localUpdates.parentId = updates.parentId;
	if (updates.icon !== undefined) localUpdates.icon = updates.icon;
	if (updates.color !== undefined) localUpdates.color = updates.color;

	await db.table('skills').update(id, localUpdates);
}

async function deleteSkill(id: string): Promise<void> {
	const now = new Date().toISOString();
	// Soft-delete all activities for this skill
	const skillActivities = await db
		.table<LocalActivity>('activities')
		.where('skillId')
		.equals(id)
		.toArray();
	for (const a of skillActivities) {
		await db.table('activities').update(a.id, { deletedAt: now, updatedAt: now });
	}
	await db.table('skills').update(id, { deletedAt: now, updatedAt: now });
	SkillTreeEvents.skillDeleted();
}

async function addXp(
	skillId: string,
	xp: number,
	description: string,
	duration?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
	const skill = await db.table<LocalSkill>('skills').get(skillId);
	if (!skill) return { leveledUp: false, newLevel: 0 };

	const newTotalXp = skill.totalXp + xp;
	const newCurrentXp = skill.currentXp + xp;
	const newLevel = calculateLevel(newTotalXp);
	const leveledUp = newLevel > skill.level;

	await db.table('skills').update(skillId, {
		totalXp: newTotalXp,
		currentXp: newCurrentXp,
		level: newLevel,
		updatedAt: new Date().toISOString(),
	});

	const activity = createActivity(skillId, xp, description, duration);
	await db.table<LocalActivity>('activities').add({
		id: activity.id,
		skillId: activity.skillId,
		xpEarned: activity.xpEarned,
		description: activity.description,
		duration: activity.duration,
		timestamp: activity.timestamp,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});

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
