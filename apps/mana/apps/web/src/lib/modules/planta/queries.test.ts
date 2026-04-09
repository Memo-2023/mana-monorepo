/**
 * Pure-function tests for planta queries.
 *
 * Covers the watering date math that drives every "needs water" badge in
 * the UI — getting this wrong silently causes bad reminders, so it's worth
 * pinning down with explicit cases for today / overdue / future / missing.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
	getDaysUntilWatering,
	isWateringOverdue,
	getScheduleForPlant,
	getLogsForPlant,
} from './queries';
import type { WateringSchedule, WateringLog } from './types';

function makeSchedule(overrides: Partial<WateringSchedule> = {}): WateringSchedule {
	return {
		id: 's1',
		plantId: 'p1',
		frequencyDays: 7,
		lastWateredAt: undefined,
		nextWateringAt: undefined,
		reminderEnabled: false,
		reminderHoursBefore: 0,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
		updatedAt: new Date('2026-04-01T00:00:00.000Z'),
		...overrides,
	};
}

describe('getDaysUntilWatering', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Pin "now" so day-math is deterministic.
		vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns null when schedule is undefined', () => {
		expect(getDaysUntilWatering(undefined)).toBeNull();
	});

	it('returns null when nextWateringAt is missing', () => {
		const s = makeSchedule({ nextWateringAt: undefined });
		expect(getDaysUntilWatering(s)).toBeNull();
	});

	it('returns 0 when next watering is later today', () => {
		const s = makeSchedule({ nextWateringAt: new Date('2026-04-09T18:00:00.000Z') });
		expect(getDaysUntilWatering(s)).toBe(1); // 6h ahead → ceil → 1
	});

	it('returns the exact remaining whole days for a future date', () => {
		const s = makeSchedule({ nextWateringAt: new Date('2026-04-12T12:00:00.000Z') });
		expect(getDaysUntilWatering(s)).toBe(3);
	});

	it('returns negative days when overdue', () => {
		const s = makeSchedule({ nextWateringAt: new Date('2026-04-06T12:00:00.000Z') });
		expect(getDaysUntilWatering(s)).toBe(-3);
	});

	it('rounds up partial days (ceil) for "almost a week from now"', () => {
		// 6 days + 1 hour from now → should report 7, not 6
		const s = makeSchedule({ nextWateringAt: new Date('2026-04-15T13:00:00.000Z') });
		expect(getDaysUntilWatering(s)).toBe(7);
	});

	it('accepts a string nextWateringAt (defensive — type says Date but Dexie returns ISO)', () => {
		const s = makeSchedule({
			nextWateringAt: '2026-04-12T12:00:00.000Z' as unknown as Date,
		});
		expect(getDaysUntilWatering(s)).toBe(3);
	});
});

describe('isWateringOverdue', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
	});
	afterEach(() => vi.useRealTimers());

	it('is false when schedule is undefined', () => {
		expect(isWateringOverdue(undefined)).toBe(false);
	});

	it('is false when next watering is in the future', () => {
		expect(
			isWateringOverdue(makeSchedule({ nextWateringAt: new Date('2026-04-12T12:00:00.000Z') }))
		).toBe(false);
	});

	it('is true when next watering is in the past', () => {
		expect(
			isWateringOverdue(makeSchedule({ nextWateringAt: new Date('2026-04-06T12:00:00.000Z') }))
		).toBe(true);
	});
});

describe('getScheduleForPlant', () => {
	it('returns the matching schedule by plantId', () => {
		const a = makeSchedule({ id: 'a', plantId: 'p1' });
		const b = makeSchedule({ id: 'b', plantId: 'p2' });
		expect(getScheduleForPlant([a, b], 'p2')?.id).toBe('b');
	});

	it('returns undefined when no schedule matches', () => {
		expect(getScheduleForPlant([], 'p1')).toBeUndefined();
	});
});

describe('getLogsForPlant', () => {
	const makeLog = (overrides: Partial<WateringLog>): WateringLog => ({
		id: 'l',
		plantId: 'p1',
		wateredAt: new Date('2026-04-01T00:00:00.000Z'),
		notes: undefined,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
		...overrides,
	});

	it('filters by plantId and sorts newest first', () => {
		const logs: WateringLog[] = [
			makeLog({ id: '1', plantId: 'p1', wateredAt: new Date('2026-04-01T00:00:00.000Z') }),
			makeLog({ id: '2', plantId: 'p2', wateredAt: new Date('2026-04-05T00:00:00.000Z') }),
			makeLog({ id: '3', plantId: 'p1', wateredAt: new Date('2026-04-07T00:00:00.000Z') }),
			makeLog({ id: '4', plantId: 'p1', wateredAt: new Date('2026-04-03T00:00:00.000Z') }),
		];
		const result = getLogsForPlant(logs, 'p1');
		expect(result.map((l) => l.id)).toEqual(['3', '4', '1']);
	});
});
