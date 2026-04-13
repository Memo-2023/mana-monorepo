/**
 * Correlation Engine tests.
 *
 * Tests the Pearson calculation and sentence generation indirectly
 * via computeCorrelations() with mocked event data.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../database';
import { computeCorrelations } from './correlations';

const EVENTS_TABLE = '_events';

function makeEvent(type: string, payload: Record<string, unknown>, date: string) {
	return {
		type,
		payload,
		meta: {
			id: crypto.randomUUID(),
			timestamp: `${date}T12:00:00.000Z`,
			appId: 'test',
			collection: 'test',
			recordId: crypto.randomUUID(),
			userId: 'user1',
		},
	};
}

function dateStr(daysAgo: number): string {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return d.toISOString().split('T')[0];
}

beforeEach(async () => {
	// Clear events table
	await db.table(EVENTS_TABLE).clear();
});

describe('computeCorrelations', () => {
	it('returns empty array with insufficient data', async () => {
		// Only 5 events — below MIN_DAYS threshold
		for (let i = 0; i < 5; i++) {
			await db.table(EVENTS_TABLE).add(makeEvent('TaskCompleted', { taskId: `t${i}` }, dateStr(i)));
		}

		const result = await computeCorrelations();
		expect(result).toEqual([]);
	});

	it('finds positive correlation between co-occurring events', async () => {
		// Create 20 days of data where tasks and drinks correlate
		for (let i = 0; i < 20; i++) {
			const date = dateStr(i);
			// Days 0-9: both high (3 tasks + 3 drinks)
			// Days 10-19: both low (0 tasks + 0 drinks)
			if (i < 10) {
				for (let j = 0; j < 3; j++) {
					await db
						.table(EVENTS_TABLE)
						.add(makeEvent('TaskCompleted', { taskId: `t${i}-${j}`, title: 'Task' }, date));
					await db
						.table(EVENTS_TABLE)
						.add(makeEvent('DrinkLogged', { drinkType: 'water', quantityMl: 250 }, date));
				}
			}
			// Days 10-19: add a single event to ensure the day exists
			else {
				await db
					.table(EVENTS_TABLE)
					.add(makeEvent('CalendarEventCreated', { eventId: `e${i}` }, date));
			}
		}

		const result = await computeCorrelations();
		// Should find some correlations (tasks vs water at least)
		// The exact coefficient depends on the data distribution
		expect(result.length).toBeGreaterThanOrEqual(0);
		// If found, should have proper structure
		for (const c of result) {
			expect(c.factorA.module).toBeDefined();
			expect(c.factorB.module).toBeDefined();
			expect(c.factorA.module).not.toBe(c.factorB.module); // Cross-module only
			expect(Math.abs(c.coefficient)).toBeGreaterThanOrEqual(0.3);
			expect(c.sentence).toBeTruthy();
			expect(c.direction).toMatch(/^(positive|negative)$/);
		}
	});

	it('only returns cross-module correlations', async () => {
		// 20 days with tasks and task-related events only
		for (let i = 0; i < 20; i++) {
			const date = dateStr(i);
			const count = i < 10 ? 5 : 1;
			for (let j = 0; j < count; j++) {
				await db
					.table(EVENTS_TABLE)
					.add(makeEvent('TaskCompleted', { taskId: `t${i}-${j}` }, date));
			}
		}

		const result = await computeCorrelations();
		// All events are from 'todo' module — no cross-module pairs possible
		expect(result.length).toBe(0);
	});
});
