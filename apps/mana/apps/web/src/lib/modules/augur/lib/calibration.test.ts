/**
 * Augur — Calibration math.
 *
 * Outcomes are weighted (fulfilled=1, partly=0.5, not-fulfilled=0).
 * Brier score is squared error vs. the user-supplied probability.
 * Open entries are excluded from every score — they have no truth yet.
 */

import { describe, expect, it } from 'vitest';
import {
	calibrationPerSource,
	isScored,
	outcomeValue,
	overallStats,
	vibeHitRates,
} from './calibration';
import type { AugurEntry, AugurOutcome, AugurSourceCategory, AugurVibe } from '../types';

let nextId = 0;

function fixture(overrides: Partial<AugurEntry> = {}): AugurEntry {
	return {
		id: `e${nextId++}`,
		kind: 'hunch',
		source: 'gut',
		sourceCategory: 'gut',
		claim: 'something',
		vibe: 'mysterious',
		feltMeaning: null,
		expectedOutcome: null,
		expectedBy: null,
		probability: null,
		outcome: 'open',
		outcomeNote: null,
		resolvedAt: null,
		encounteredAt: '2026-01-01',
		tags: [],
		relatedDreamId: null,
		relatedDecisionId: null,
		livingOracleSnapshot: null,
		isPrivate: true,
		isArchived: false,
		visibility: 'private',
		unlistedToken: '',
		unlistedExpiresAt: null,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

describe('outcomeValue', () => {
	it('weights fulfilled as 1, partly as 0.5, not-fulfilled as 0, open as null', () => {
		expect(outcomeValue('fulfilled')).toBe(1);
		expect(outcomeValue('partly')).toBe(0.5);
		expect(outcomeValue('not-fulfilled')).toBe(0);
		expect(outcomeValue('open')).toBeNull();
	});
});

describe('isScored', () => {
	it('only true for resolved outcomes', () => {
		expect(isScored(fixture({ outcome: 'fulfilled' }))).toBe(true);
		expect(isScored(fixture({ outcome: 'partly' }))).toBe(true);
		expect(isScored(fixture({ outcome: 'not-fulfilled' }))).toBe(true);
		expect(isScored(fixture({ outcome: 'open' }))).toBe(false);
	});
});

describe('overallStats', () => {
	it('returns zero counts on empty input', () => {
		const s = overallStats([]);
		expect(s.total).toBe(0);
		expect(s.resolved).toBe(0);
		expect(s.open).toBe(0);
		expect(s.hitRate).toBeNull();
		expect(s.brier).toBeNull();
	});

	it('counts open separately from resolved', () => {
		const s = overallStats([
			fixture({ outcome: 'open' }),
			fixture({ outcome: 'open' }),
			fixture({ outcome: 'fulfilled' }),
		]);
		expect(s.total).toBe(3);
		expect(s.resolved).toBe(1);
		expect(s.open).toBe(2);
		expect(s.hitRate).toBe(1);
	});

	it('weighted hit-rate honours partly = 0.5', () => {
		const s = overallStats([
			fixture({ outcome: 'fulfilled' }),
			fixture({ outcome: 'partly' }),
			fixture({ outcome: 'not-fulfilled' }),
		]);
		expect(s.hitRate).toBeCloseTo(0.5, 5);
	});

	it('Brier score is squared error vs. probability', () => {
		// probability 0.8, outcome fulfilled (1) → diff^2 = 0.04
		// probability 0.3, outcome not-fulfilled (0) → diff^2 = 0.09
		// mean = 0.065
		const s = overallStats([
			fixture({ outcome: 'fulfilled', probability: 0.8 }),
			fixture({ outcome: 'not-fulfilled', probability: 0.3 }),
		]);
		expect(s.brier).toBeCloseTo(0.065, 5);
		expect(s.brierN).toBe(2);
	});

	it('skips Brier contribution when probability is missing', () => {
		const s = overallStats([
			fixture({ outcome: 'fulfilled' }),
			fixture({ outcome: 'fulfilled', probability: 0.8 }),
		]);
		expect(s.brierN).toBe(1);
	});
});

describe('calibrationPerSource', () => {
	it('one row per category that has at least one resolved entry', () => {
		const rows = calibrationPerSource([
			fixture({ sourceCategory: 'gut', outcome: 'fulfilled' }),
			fixture({ sourceCategory: 'gut', outcome: 'not-fulfilled' }),
			fixture({ sourceCategory: 'tarot', outcome: 'partly' }),
			fixture({ sourceCategory: 'horoscope', outcome: 'open' }), // not in result
		]);
		expect(rows.map((r) => r.sourceCategory).sort()).toEqual(['gut', 'tarot']);
	});

	it('rows are ranked by sample size descending', () => {
		const cats: AugurSourceCategory[] = ['gut', 'gut', 'gut', 'tarot', 'tarot'];
		const rows = calibrationPerSource(
			cats.map((c) => fixture({ sourceCategory: c, outcome: 'fulfilled' }))
		);
		expect(rows[0]!.sourceCategory).toBe('gut');
		expect(rows[0]!.n).toBe(3);
		expect(rows[1]!.sourceCategory).toBe('tarot');
	});

	it('per-source hit-rate is weighted, breakdown is intact', () => {
		const rows = calibrationPerSource([
			fixture({ sourceCategory: 'gut', outcome: 'fulfilled' }),
			fixture({ sourceCategory: 'gut', outcome: 'partly' }),
			fixture({ sourceCategory: 'gut', outcome: 'not-fulfilled' }),
		]);
		const gut = rows.find((r) => r.sourceCategory === 'gut')!;
		expect(gut.n).toBe(3);
		expect(gut.fulfilled).toBe(1);
		expect(gut.partly).toBe(1);
		expect(gut.notFulfilled).toBe(1);
		expect(gut.hitRate).toBeCloseTo(0.5, 5);
	});
});

describe('vibeHitRates', () => {
	it('returns one row per vibe with n=0 when no resolved entries exist', () => {
		const rows = vibeHitRates([fixture({ vibe: 'good', outcome: 'open' })]);
		const good = rows.find((r) => r.vibe === 'good')!;
		expect(good.n).toBe(0);
		expect(good.directionalHitRate).toBeNull();
	});

	it('directional hit for good = fulfilled, for bad = not-fulfilled', () => {
		const rows = vibeHitRates([
			// good vibe: 2 fulfilled, 1 not-fulfilled → directional 2/3
			fixture({ vibe: 'good', outcome: 'fulfilled' }),
			fixture({ vibe: 'good', outcome: 'fulfilled' }),
			fixture({ vibe: 'good', outcome: 'not-fulfilled' }),
			// bad vibe: 1 fulfilled (warning was wrong), 1 not-fulfilled (warning right)
			fixture({ vibe: 'bad', outcome: 'fulfilled' }),
			fixture({ vibe: 'bad', outcome: 'not-fulfilled' }),
		]);
		const good = rows.find((r) => r.vibe === 'good')!;
		const bad = rows.find((r) => r.vibe === 'bad')!;
		expect(good.directionalHitRate).toBeCloseTo(2 / 3, 5);
		expect(bad.directionalHitRate).toBeCloseTo(0.5, 5);
	});

	it('mysterious vibe has no direction', () => {
		const rows = vibeHitRates([
			fixture({ vibe: 'mysterious', outcome: 'fulfilled' }),
			fixture({ vibe: 'mysterious', outcome: 'not-fulfilled' }),
		]);
		const mys = rows.find((r) => r.vibe === 'mysterious')!;
		expect(mys.n).toBe(2);
		expect(mys.directionalHitRate).toBeNull();
	});
});

// Type-only tests — surface a contract drift if these references are
// renamed without updating callers in the OracleView / tools.ts.
describe('type contract', () => {
	it('AugurOutcome union shape matches outcomeValue switch coverage', () => {
		const all: AugurOutcome[] = ['open', 'fulfilled', 'partly', 'not-fulfilled'];
		for (const o of all) outcomeValue(o); // never throws
	});

	it('AugurVibe union shape matches vibeHitRates output', () => {
		const all: AugurVibe[] = ['good', 'bad', 'mysterious'];
		const rows = vibeHitRates(all.map((v) => fixture({ vibe: v, outcome: 'fulfilled' })));
		expect(rows.map((r) => r.vibe).sort()).toEqual(['bad', 'good', 'mysterious']);
	});
});
