import { describe, expect, it } from 'vitest';
import { daysBetween, derivePhase, findPeriodForDate, getPeriodDayNumber } from './phase';
import type { Period } from '../types';

function makePeriod(overrides: Partial<Period>): Period {
	return {
		id: 'c',
		startDate: '2026-01-01',
		periodEndDate: null,
		endDate: null,
		length: null,
		isPredicted: false,
		isArchived: false,
		notes: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	};
}

describe('daysBetween', () => {
	it('returns 0 for same day', () => {
		expect(daysBetween('2026-04-07', '2026-04-07')).toBe(0);
	});
	it('returns positive when a > b', () => {
		expect(daysBetween('2026-04-10', '2026-04-07')).toBe(3);
	});
	it('returns negative when a < b', () => {
		expect(daysBetween('2026-04-04', '2026-04-07')).toBe(-3);
	});
	it('handles month boundaries', () => {
		expect(daysBetween('2026-05-01', '2026-04-29')).toBe(2);
	});
});

describe('findPeriodForDate', () => {
	const periods: Period[] = [
		makePeriod({ id: 'c1', startDate: '2026-01-01' }),
		makePeriod({ id: 'c2', startDate: '2026-01-29' }),
		makePeriod({ id: 'c3', startDate: '2026-02-26' }),
	];

	it('returns null for date before any period', () => {
		expect(findPeriodForDate('2025-12-31', periods)).toBeNull();
	});
	it('finds the latest period whose startDate <= date', () => {
		expect(findPeriodForDate('2026-02-15', periods)?.id).toBe('c2');
	});
	it('matches exact start date', () => {
		expect(findPeriodForDate('2026-02-26', periods)?.id).toBe('c3');
	});
	it('returns most recent for late date', () => {
		expect(findPeriodForDate('2026-12-31', periods)?.id).toBe('c3');
	});
});

describe('getPeriodDayNumber', () => {
	const period = makePeriod({ startDate: '2026-04-01' });
	it('returns 1 on the start date', () => {
		expect(getPeriodDayNumber('2026-04-01', period)).toBe(1);
	});
	it('returns N+1 N days after start', () => {
		expect(getPeriodDayNumber('2026-04-08', period)).toBe(8);
	});
	it('returns null before the period', () => {
		expect(getPeriodDayNumber('2026-03-30', period)).toBeNull();
	});
});

describe('derivePhase', () => {
	const periods: Period[] = [
		makePeriod({
			id: 'c1',
			startDate: '2026-04-01',
			periodEndDate: '2026-04-05', // 5 days of period
			length: 28,
		}),
	];

	it('returns unknown when no period covers the date', () => {
		expect(derivePhase('2025-12-31', periods)).toBe('unknown');
	});
	it('returns menstruation on day 1', () => {
		expect(derivePhase('2026-04-01', periods)).toBe('menstruation');
	});
	it('returns menstruation on the last bleeding day', () => {
		expect(derivePhase('2026-04-05', periods)).toBe('menstruation');
	});
	it('returns follicular after period before ovulation', () => {
		// day 8, ovulation should be day 14 (28 - 14)
		expect(derivePhase('2026-04-08', periods)).toBe('follicular');
	});
	it('returns ovulation around day 14 (±1)', () => {
		// 2026-04-14 = day 14
		expect(derivePhase('2026-04-14', periods)).toBe('ovulation');
		expect(derivePhase('2026-04-13', periods)).toBe('ovulation');
		expect(derivePhase('2026-04-15', periods)).toBe('ovulation');
	});
	it('returns luteal after ovulation', () => {
		// day 20
		expect(derivePhase('2026-04-20', periods)).toBe('luteal');
	});
	it('falls back to default period length when periodEndDate missing', () => {
		const c: Period[] = [makePeriod({ startDate: '2026-04-01', length: 28 })];
		// default period length = 5, so day 5 is still menstruation
		expect(derivePhase('2026-04-05', c)).toBe('menstruation');
		expect(derivePhase('2026-04-06', c)).toBe('follicular');
	});
});
