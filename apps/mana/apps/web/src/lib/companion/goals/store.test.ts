/**
 * Goal Tracker tests — event matching, period reset, CRUD.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '$lib/data/database';
import { eventBus } from '$lib/data/events/event-bus';
import { goalStore, startGoalTracker, stopGoalTracker, GOAL_TEMPLATES } from './index';
import type { LocalGoal } from './types';

const TABLE = 'companionGoals';
const flush = () => new Promise((r) => setTimeout(r, 50));

beforeEach(async () => {
	await db.table(TABLE).clear();
});

afterEach(() => {
	stopGoalTracker();
});

describe('goalStore CRUD', () => {
	it('creates a goal from template', async () => {
		const tpl = GOAL_TEMPLATES[0]; // Water daily
		const goal = await goalStore.createFromTemplate(tpl);
		expect(goal.id).toBeTruthy();
		expect(goal.title).toBe(tpl.title);
		expect(goal.status).toBe('active');
		expect(goal.currentValue).toBe(0);

		const stored = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(stored).toBeTruthy();
	});

	it('pauses and resumes a goal', async () => {
		const goal = await goalStore.createFromTemplate(GOAL_TEMPLATES[0]);
		await goalStore.pause(goal.id);
		let stored = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(stored?.status).toBe('paused');

		await goalStore.resume(goal.id);
		stored = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(stored?.status).toBe('active');
	});

	it('soft-deletes a goal', async () => {
		const goal = await goalStore.createFromTemplate(GOAL_TEMPLATES[0]);
		await goalStore.delete(goal.id);
		const stored = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(stored?.deletedAt).toBeTruthy();
	});
});

describe('goal event tracking', () => {
	it('increments currentValue on matching event', async () => {
		startGoalTracker();

		// Create "Tasks completed" goal (event_count, TaskCompleted)
		const goal = await goalStore.createFromTemplate(GOAL_TEMPLATES[1]); // 5 Tasks/Tag

		// Emit a TaskCompleted event
		eventBus.emit({
			type: 'TaskCompleted',
			payload: { taskId: '1', title: 'Test', wasOverdue: false },
			meta: {
				id: '1',
				timestamp: new Date().toISOString(),
				appId: 'todo',
				collection: 'tasks',
				recordId: '1',
				userId: 'u1',
			},
		});
		await flush();

		const updated = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(updated?.currentValue).toBe(1);
	});

	it('respects filter on matching events', async () => {
		startGoalTracker();

		// Water goal: only counts DrinkLogged where drinkType === 'water'
		const goal = await goalStore.createFromTemplate(GOAL_TEMPLATES[0]); // Water

		// Coffee event — should NOT count
		eventBus.emit({
			type: 'DrinkLogged',
			payload: { drinkType: 'coffee', quantityMl: 200 },
			meta: {
				id: '1',
				timestamp: new Date().toISOString(),
				appId: 'drink',
				collection: 'drinkEntries',
				recordId: '1',
				userId: 'u1',
			},
		});
		await flush();

		let updated = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(updated?.currentValue).toBe(0); // Not incremented

		// Water event — should count
		eventBus.emit({
			type: 'DrinkLogged',
			payload: { drinkType: 'water', quantityMl: 250 },
			meta: {
				id: '2',
				timestamp: new Date().toISOString(),
				appId: 'drink',
				collection: 'drinkEntries',
				recordId: '2',
				userId: 'u1',
			},
		});
		await flush();

		updated = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(updated?.currentValue).toBe(1); // Now incremented
	});

	it('does not track paused goals', async () => {
		startGoalTracker();

		const goal = await goalStore.createFromTemplate(GOAL_TEMPLATES[1]);
		await goalStore.pause(goal.id);

		eventBus.emit({
			type: 'TaskCompleted',
			payload: { taskId: '1', title: 'Test', wasOverdue: false },
			meta: {
				id: '1',
				timestamp: new Date().toISOString(),
				appId: 'todo',
				collection: 'tasks',
				recordId: '1',
				userId: 'u1',
			},
		});
		await flush();

		const updated = await db.table<LocalGoal>(TABLE).get(goal.id);
		expect(updated?.currentValue).toBe(0); // Not tracked
	});
});
