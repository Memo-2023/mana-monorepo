/**
 * Goal Store — CRUD + event-driven progress tracking.
 *
 * Goals are persisted in the companionGoals Dexie table. Progress
 * is tracked by subscribing to the domain event bus and incrementing
 * currentValue when matching events arrive.
 */

import { db } from '$lib/data/database';
import { eventBus } from '$lib/data/events/event-bus';
import { emitDomainEvent } from '$lib/data/events/emit';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import type { DomainEvent } from '$lib/data/events/types';
import type { LocalGoal, GoalTemplate } from './types';

const TABLE = 'companionGoals';

function periodStart(period: 'day' | 'week' | 'month'): string {
	const now = new Date();
	if (period === 'day') return now.toISOString().split('T')[0];
	if (period === 'week') {
		const d = new Date(now);
		d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
		return d.toISOString().split('T')[0];
	}
	// month
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function matchesGoal(goal: LocalGoal, event: DomainEvent): boolean {
	if (event.type !== goal.metric.eventType) return false;
	if (goal.metric.filterField && goal.metric.filterValue) {
		const payload = event.payload as Record<string, unknown>;
		if (String(payload[goal.metric.filterField]) !== goal.metric.filterValue) return false;
	}
	return true;
}

function getIncrement(goal: LocalGoal, event: DomainEvent): number {
	if (goal.metric.source === 'event_count') return 1;
	if (goal.metric.source === 'event_sum' && goal.metric.sumField) {
		const payload = event.payload as Record<string, unknown>;
		const val = payload[goal.metric.sumField];
		return typeof val === 'number' ? val : 0;
	}
	return 0;
}

// ── Event subscription ──────────────────────────────

let unsubscribe: (() => void) | null = null;

export function startGoalTracker(): void {
	if (unsubscribe) return;
	unsubscribe = eventBus.onAny(async (event: DomainEvent) => {
		const goals = await db.table<LocalGoal>(TABLE).toArray();
		const active = goals.filter((g) => g.status === 'active' && !g.deletedAt);

		for (const goal of active) {
			if (!matchesGoal(goal, event)) continue;

			// Reset if period rolled over
			const currentPeriod = periodStart(goal.target.period);
			const needsReset = goal.currentPeriodStart !== currentPeriod;
			const newValue = (needsReset ? 0 : goal.currentValue) + getIncrement(goal, event);

			await db.table(TABLE).update(goal.id, {
				currentValue: newValue,
				currentPeriodStart: currentPeriod,
				updatedAt: new Date().toISOString(),
			});

			// Check if goal reached
			const reached =
				goal.target.comparison === 'gte'
					? newValue >= goal.target.value
					: newValue <= goal.target.value;

			if (reached && (needsReset || goal.currentValue < goal.target.value)) {
				emitDomainEvent('GoalReached', 'companion', TABLE, goal.id, {
					goalId: goal.id,
					title: goal.title,
					value: newValue,
					target: goal.target.value,
					period: goal.target.period,
				});
			}
		}
	});
}

export function stopGoalTracker(): void {
	unsubscribe?.();
	unsubscribe = null;
}

// ── CRUD ────────────────────────────────────────────

export const goalStore = {
	async createFromTemplate(template: GoalTemplate): Promise<LocalGoal> {
		const now = new Date().toISOString();
		const goal: LocalGoal = {
			id: crypto.randomUUID(),
			title: template.title,
			description: template.description,
			metric: template.metric,
			target: template.target,
			moduleId: template.moduleId,
			status: 'active',
			currentValue: 0,
			currentPeriodStart: periodStart(template.target.period),
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
			createdAt: now,
			updatedAt: now,
		};
		await db.table(TABLE).add(goal);
		return goal;
	},

	async create(input: {
		title: string;
		description?: string;
		moduleId: string;
		metric: LocalGoal['metric'];
		target: LocalGoal['target'];
	}): Promise<LocalGoal> {
		const now = new Date().toISOString();
		const goal: LocalGoal = {
			id: crypto.randomUUID(),
			title: input.title,
			description: input.description,
			metric: input.metric,
			target: input.target,
			moduleId: input.moduleId,
			status: 'active',
			currentValue: 0,
			currentPeriodStart: periodStart(input.target.period),
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
			createdAt: now,
			updatedAt: now,
		};
		await db.table(TABLE).add(goal);
		return goal;
	},

	async pause(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			status: 'paused',
			updatedAt: new Date().toISOString(),
		});
	},

	async resume(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			status: 'active',
			updatedAt: new Date().toISOString(),
		});
	},

	async complete(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			status: 'completed',
			updatedAt: new Date().toISOString(),
		});
	},

	async abandon(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			status: 'abandoned',
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Flip a goal's visibility. Enables the "public progress page" use
	 * case — user marks a fitness/learning goal 'public' so it appears
	 * in the goals.goals embed on their website.
	 */
	async setVisibility(id: string, next: VisibilityLevel): Promise<void> {
		const existing = await db.table<LocalGoal>(TABLE).get(id);
		if (!existing) throw new Error(`Goal ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalGoal> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: now,
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await db.table(TABLE).update(id, patch);

		emitDomainEvent('VisibilityChanged', 'goals', TABLE, id, {
			recordId: id,
			collection: TABLE,
			before,
			after: next,
		});
	},
};
