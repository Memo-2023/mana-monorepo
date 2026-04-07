import { describe, expect, it } from 'vitest';
import {
	detectPeriodEnd,
	DRY_DAYS_FOR_PERIOD_END,
	isBleedingFlow,
	MIN_GAP_FOR_NEW_CYCLE,
	shouldStartNewCycle,
} from './auto-detect';
import type { Cycle, CycleDayLog, Flow } from '../types';

function makeCycle(overrides: Partial<Cycle>): Cycle {
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

function makeLog(logDate: string, flow: Flow): CycleDayLog {
	return {
		id: `log-${logDate}`,
		logDate,
		cycleId: 'c',
		flow,
		mood: null,
		energy: null,
		temperature: null,
		cervicalMucus: null,
		symptoms: [],
		sexualActivity: null,
		notes: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	};
}

describe('isBleedingFlow', () => {
	it('returns true for light/medium/heavy', () => {
		expect(isBleedingFlow('light')).toBe(true);
		expect(isBleedingFlow('medium')).toBe(true);
		expect(isBleedingFlow('heavy')).toBe(true);
	});
	it('returns false for none/spotting', () => {
		expect(isBleedingFlow('none')).toBe(false);
		expect(isBleedingFlow('spotting')).toBe(false);
	});
});

describe('shouldStartNewCycle', () => {
	it('returns false for non-bleeding flow', () => {
		expect(shouldStartNewCycle('2026-04-07', 'none', [])).toBe(false);
		expect(shouldStartNewCycle('2026-04-07', 'spotting', [])).toBe(false);
	});

	it('returns true with no existing cycles and bleeding flow', () => {
		expect(shouldStartNewCycle('2026-04-07', 'medium', [])).toBe(true);
	});

	it('returns false when current cycle is still open (no periodEndDate)', () => {
		const cycles = [makeCycle({ startDate: '2026-04-01' })];
		// flow during the open period — not a new cycle
		expect(shouldStartNewCycle('2026-04-03', 'heavy', cycles)).toBe(false);
	});

	it('returns false when bleed is too soon after period end', () => {
		const cycles = [makeCycle({ startDate: '2026-04-01', periodEndDate: '2026-04-05' })];
		// 9 days after periodEndDate — too soon, probably mid-cycle bleeding
		expect(shouldStartNewCycle('2026-04-14', 'medium', cycles)).toBe(false);
	});

	it('returns true when bleed is at least MIN_GAP days after period end', () => {
		const cycles = [makeCycle({ startDate: '2026-04-01', periodEndDate: '2026-04-05' })];
		const newDate = '2026-04-15'; // 10 days after
		expect(daysGapForTest(newDate, '2026-04-05')).toBe(MIN_GAP_FOR_NEW_CYCLE);
		expect(shouldStartNewCycle(newDate, 'medium', cycles)).toBe(true);
	});

	it('ignores predicted cycles', () => {
		const cycles = [
			makeCycle({ id: 'real', startDate: '2026-01-01', periodEndDate: '2026-01-05' }),
			makeCycle({ id: 'pred', startDate: '2026-04-01', isPredicted: true }),
		];
		// 2026-04-15 → with the real cycle far in the past, should start new
		expect(shouldStartNewCycle('2026-04-15', 'medium', cycles)).toBe(true);
	});

	it('returns false for date before the latest cycle', () => {
		const cycles = [makeCycle({ startDate: '2026-04-01', periodEndDate: '2026-04-05' })];
		// Backfilling an old date should never auto-create
		expect(shouldStartNewCycle('2026-03-10', 'medium', cycles)).toBe(false);
	});
});

describe('detectPeriodEnd', () => {
	const openCycle = makeCycle({ id: 'c', startDate: '2026-04-01' });

	it('returns null for non-none flow', () => {
		expect(detectPeriodEnd('2026-04-07', 'light', openCycle, [])).toBeNull();
	});

	it('returns null without an open cycle', () => {
		expect(detectPeriodEnd('2026-04-07', 'none', null, [])).toBeNull();
	});

	it('returns null when cycle already has periodEndDate', () => {
		const closed = makeCycle({ id: 'c', startDate: '2026-04-01', periodEndDate: '2026-04-05' });
		expect(detectPeriodEnd('2026-04-07', 'none', closed, [])).toBeNull();
	});

	it('returns null when no bleeding day exists in cycle', () => {
		const logs = [makeLog('2026-04-01', 'none'), makeLog('2026-04-02', 'none')];
		expect(detectPeriodEnd('2026-04-07', 'none', openCycle, logs)).toBeNull();
	});

	it('returns null when not enough dry days have passed', () => {
		const logs = [makeLog('2026-04-04', 'medium')];
		// logDate = 2026-04-05 → only 1 day after bleeding
		expect(detectPeriodEnd('2026-04-05', 'none', openCycle, logs)).toBeNull();
	});

	it('returns lastBleedingDay after DRY_DAYS_FOR_PERIOD_END', () => {
		const logs = [
			makeLog('2026-04-01', 'medium'),
			makeLog('2026-04-02', 'medium'),
			makeLog('2026-04-03', 'medium'),
			makeLog('2026-04-04', 'light'),
		];
		// logDate = 2026-04-06 → 2 days after last bleeding (04-04)
		expect(daysGapForTest('2026-04-06', '2026-04-04')).toBe(DRY_DAYS_FOR_PERIOD_END);
		expect(detectPeriodEnd('2026-04-06', 'none', openCycle, logs)).toBe('2026-04-04');
	});

	it('uses the LAST bleeding day, not the first', () => {
		const logs = [
			makeLog('2026-04-01', 'heavy'),
			makeLog('2026-04-02', 'medium'),
			makeLog('2026-04-03', 'light'),
		];
		expect(detectPeriodEnd('2026-04-05', 'none', openCycle, logs)).toBe('2026-04-03');
	});

	it('ignores logs after the current logDate (chronology safe)', () => {
		const logs = [
			makeLog('2026-04-01', 'medium'),
			makeLog('2026-04-02', 'medium'),
			// User backfills logDate '2026-04-03' as none → should look at logs ≤ 2026-04-03
			makeLog('2026-04-10', 'medium'), // future log shouldn't affect detection for 04-03
		];
		// 2026-04-03 - 2026-04-02 = 1 day → not enough
		expect(detectPeriodEnd('2026-04-03', 'none', openCycle, logs)).toBeNull();
	});

	it('handles spotting as not bleeding (so spotting is not lastBleedingDay)', () => {
		const logs = [
			makeLog('2026-04-01', 'medium'),
			makeLog('2026-04-02', 'spotting'), // not counted as bleeding
		];
		// 2026-04-03 - 2026-04-01 = 2 → trigger, lastBleedingDay = 04-01
		expect(detectPeriodEnd('2026-04-03', 'none', openCycle, logs)).toBe('2026-04-01');
	});
});

// Helper for assertion clarity in tests
function daysGapForTest(later: string, earlier: string): number {
	return Math.round((new Date(later).getTime() - new Date(earlier).getTime()) / 86_400_000);
}
