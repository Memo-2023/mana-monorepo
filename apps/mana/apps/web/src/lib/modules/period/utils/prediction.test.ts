import { describe, expect, it } from 'vitest';
import {
	averagePeriodLength,
	computePeriodStats,
	daysUntilNextPeriod,
	predictFertileWindow,
	predictNextPeriodStart,
} from './prediction';
import type { Period } from '../types';

function period(startDate: string, length: number | null = null, isPredicted = false): Period {
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

describe('averagePeriodLength', () => {
	it('returns default 28 when no periods', () => {
		expect(averagePeriodLength([])).toBe(28);
	});
	it('returns default when no closed periods (no length)', () => {
		expect(averagePeriodLength([period('2026-01-01')])).toBe(28);
	});
	it('averages closed period lengths', () => {
		expect(
			averagePeriodLength([
				period('2026-01-01', 28),
				period('2026-02-01', 30),
				period('2026-03-01', 26),
			])
		).toBe(28);
	});
	it('caps to most recent N periods', () => {
		// 7 periods, but window=6 — oldest (length 100) should be ignored
		const c = [
			period('2026-01-01', 100),
			period('2026-02-01', 28),
			period('2026-03-01', 28),
			period('2026-04-01', 28),
			period('2026-05-01', 28),
			period('2026-06-01', 28),
			period('2026-07-01', 28),
		];
		expect(averagePeriodLength(c, 6)).toBe(28);
	});
	it('ignores predicted periods', () => {
		expect(averagePeriodLength([period('2026-01-01', 28), period('2026-02-01', 100, true)])).toBe(
			28
		);
	});
});

describe('predictNextPeriodStart', () => {
	it('returns null with no periods', () => {
		expect(predictNextPeriodStart([])).toBeNull();
	});
	it('predicts based on latest start + average length', () => {
		const c = [period('2026-01-01', 28), period('2026-01-29', 28)];
		expect(predictNextPeriodStart(c)).toBe('2026-02-26');
	});
	it('uses default length when no closed periods exist', () => {
		const c = [period('2026-01-01')];
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
		// Create a period that started 14 days ago (default length 28 → next in 14 days)
		const start = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
		const result = daysUntilNextPeriod([period(start)]);
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
		// Default 28 day period, luteal=14, so ovulation = day 14 (= start + 13 days)
		const c = [period('2026-04-01', 28)];
		const window = predictFertileWindow(c);
		expect(window).not.toBeNull();
		// ovulationDay = 28 - 14 = 14, so start = startDate + (14 - 5) = +9 days = 2026-04-10
		// end = startDate + (14 + 1) = +15 = 2026-04-16
		expect(window?.start).toBe('2026-04-10');
		expect(window?.end).toBe('2026-04-16');
	});
});

describe('computePeriodStats', () => {
	it('returns zeros for empty input', () => {
		expect(computePeriodStats([])).toEqual({ total: 0, avg: 0, shortest: 0, longest: 0 });
	});
	it('ignores periods with no length', () => {
		expect(computePeriodStats([period('2026-01-01')])).toEqual({
			total: 0,
			avg: 0,
			shortest: 0,
			longest: 0,
		});
	});
	it('computes avg/min/max correctly', () => {
		const c = [period('2026-01-01', 26), period('2026-02-01', 28), period('2026-03-01', 30)];
		expect(computePeriodStats(c)).toEqual({ total: 3, avg: 28, shortest: 26, longest: 30 });
	});
});
