import { describe, expect, it } from 'vitest';
import {
	averageCycleLength,
	computeCycleStats,
	daysUntilNextPeriod,
	predictFertileWindow,
	predictNextPeriodStart,
} from './prediction';
import type { Cycle } from '../types';

function cycle(startDate: string, length: number | null = null, isPredicted = false): Cycle {
	return {
		id: `c-${startDate}`,
		startDate,
		periodEndDate: null,
		endDate: null,
		length,
		isPredicted,
		isArchived: false,
		notes: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	};
}

describe('averageCycleLength', () => {
	it('returns default 28 when no cycles', () => {
		expect(averageCycleLength([])).toBe(28);
	});
	it('returns default when no closed cycles (no length)', () => {
		expect(averageCycleLength([cycle('2026-01-01')])).toBe(28);
	});
	it('averages closed cycle lengths', () => {
		expect(
			averageCycleLength([
				cycle('2026-01-01', 28),
				cycle('2026-02-01', 30),
				cycle('2026-03-01', 26),
			])
		).toBe(28);
	});
	it('caps to most recent N cycles', () => {
		// 7 cycles, but window=6 — oldest (length 100) should be ignored
		const c = [
			cycle('2026-01-01', 100),
			cycle('2026-02-01', 28),
			cycle('2026-03-01', 28),
			cycle('2026-04-01', 28),
			cycle('2026-05-01', 28),
			cycle('2026-06-01', 28),
			cycle('2026-07-01', 28),
		];
		expect(averageCycleLength(c, 6)).toBe(28);
	});
	it('ignores predicted cycles', () => {
		expect(averageCycleLength([cycle('2026-01-01', 28), cycle('2026-02-01', 100, true)])).toBe(28);
	});
});

describe('predictNextPeriodStart', () => {
	it('returns null with no cycles', () => {
		expect(predictNextPeriodStart([])).toBeNull();
	});
	it('predicts based on latest start + average length', () => {
		const c = [cycle('2026-01-01', 28), cycle('2026-01-29', 28)];
		expect(predictNextPeriodStart(c)).toBe('2026-02-26');
	});
	it('uses default length when no closed cycles exist', () => {
		const c = [cycle('2026-01-01')];
		// 2026-01-01 + 28 days = 2026-01-29
		expect(predictNextPeriodStart(c)).toBe('2026-01-29');
	});
});

describe('daysUntilNextPeriod', () => {
	it('returns null without data', () => {
		expect(daysUntilNextPeriod([])).toBeNull();
	});
	it('returns positive count when prediction is in the future', () => {
		const todayIso = new Date().toISOString().slice(0, 10);
		// Create a cycle that started 14 days ago (default length 28 → next in 14 days)
		const start = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
		const result = daysUntilNextPeriod([cycle(start)]);
		expect(result).toBeGreaterThanOrEqual(13);
		expect(result).toBeLessThanOrEqual(15);
		expect(todayIso).toBeTruthy();
	});
});

describe('predictFertileWindow', () => {
	it('returns null without data', () => {
		expect(predictFertileWindow([])).toBeNull();
	});
	it('predicts a 7-day window centred near ovulation', () => {
		// Default 28 day cycle, luteal=14, so ovulation = day 14 (= start + 13 days)
		const c = [cycle('2026-04-01', 28)];
		const window = predictFertileWindow(c);
		expect(window).not.toBeNull();
		// ovulationDay = 28 - 14 = 14, so start = startDate + (14 - 5) = +9 days = 2026-04-10
		// end = startDate + (14 + 1) = +15 = 2026-04-16
		expect(window?.start).toBe('2026-04-10');
		expect(window?.end).toBe('2026-04-16');
	});
});

describe('computeCycleStats', () => {
	it('returns zeros for empty input', () => {
		expect(computeCycleStats([])).toEqual({ total: 0, avg: 0, shortest: 0, longest: 0 });
	});
	it('ignores cycles with no length', () => {
		expect(computeCycleStats([cycle('2026-01-01')])).toEqual({
			total: 0,
			avg: 0,
			shortest: 0,
			longest: 0,
		});
	});
	it('computes avg/min/max correctly', () => {
		const c = [cycle('2026-01-01', 26), cycle('2026-02-01', 28), cycle('2026-03-01', 30)];
		expect(computeCycleStats(c)).toEqual({ total: 3, avg: 28, shortest: 26, longest: 30 });
	});
});
