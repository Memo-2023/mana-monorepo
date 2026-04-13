/**
 * Ritual Store — CRUD for rituals, steps, and execution logs.
 */

import { db } from '$lib/data/database';
import type { LocalRitual, LocalRitualStep, LocalRitualLog, RitualTemplate } from './types';

const RITUALS = 'rituals';
const STEPS = 'ritualSteps';
const LOGS = 'ritualLogs';

export const ritualStore = {
	async createFromTemplate(template: RitualTemplate): Promise<LocalRitual> {
		const now = new Date().toISOString();
		const ritual: LocalRitual = {
			id: crypto.randomUUID(),
			title: template.title,
			description: template.description,
			trigger: template.trigger,
			status: 'active',
			createdAt: now,
			updatedAt: now,
		};
		await db.table(RITUALS).add(ritual);

		// Create steps
		for (const stepDef of template.steps) {
			const step: LocalRitualStep = {
				id: crypto.randomUUID(),
				ritualId: ritual.id,
				order: stepDef.order,
				type: stepDef.type,
				label: stepDef.label,
				config: stepDef.config,
				createdAt: now,
			};
			await db.table(STEPS).add(step);
		}

		return ritual;
	},

	async create(input: {
		title: string;
		description?: string;
		trigger: LocalRitual['trigger'];
	}): Promise<LocalRitual> {
		const now = new Date().toISOString();
		const ritual: LocalRitual = {
			id: crypto.randomUUID(),
			title: input.title,
			description: input.description,
			trigger: input.trigger,
			status: 'active',
			createdAt: now,
			updatedAt: now,
		};
		await db.table(RITUALS).add(ritual);
		return ritual;
	},

	async addStep(
		ritualId: string,
		step: Omit<LocalRitualStep, 'id' | 'ritualId' | 'createdAt'>
	): Promise<LocalRitualStep> {
		const newStep: LocalRitualStep = {
			id: crypto.randomUUID(),
			ritualId,
			...step,
			createdAt: new Date().toISOString(),
		};
		await db.table(STEPS).add(newStep);
		return newStep;
	},

	async getSteps(ritualId: string): Promise<LocalRitualStep[]> {
		return db.table<LocalRitualStep>(STEPS).where('ritualId').equals(ritualId).sortBy('order');
	},

	async pause(id: string): Promise<void> {
		await db.table(RITUALS).update(id, { status: 'paused', updatedAt: new Date().toISOString() });
	},

	async resume(id: string): Promise<void> {
		await db.table(RITUALS).update(id, { status: 'active', updatedAt: new Date().toISOString() });
	},

	async archive(id: string): Promise<void> {
		await db.table(RITUALS).update(id, { status: 'archived', updatedAt: new Date().toISOString() });
	},

	async delete(id: string): Promise<void> {
		await db
			.table(RITUALS)
			.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
	},

	// ── Logs ──────────────────────────────────────────

	async logCompletion(ritualId: string, completedSteps: number, totalSteps: number): Promise<void> {
		const now = new Date().toISOString();
		const log: LocalRitualLog = {
			ritualId,
			date: now.split('T')[0],
			completedSteps,
			totalSteps,
			completedAt: completedSteps >= totalSteps ? now : undefined,
			createdAt: now,
		};
		await db.table(LOGS).add(log);
	},

	async getTodayLog(ritualId: string): Promise<LocalRitualLog | undefined> {
		const today = new Date().toISOString().split('T')[0];
		const logs = await db
			.table<LocalRitualLog>(LOGS)
			.where('[ritualId+date]')
			.equals([ritualId, today])
			.toArray();
		return logs[0];
	},
};
