/**
 * Augur — Year-Recap aggregator.
 *
 * Slices the user's full history into one year and produces the
 * snapshot that drives both YearRecapView and the augur_year_recap
 * MCP tool. Covers: filter-by-year, distribution counts,
 * best/worst-source eligibility (n>=3), and "most surprising" rule.
 */

import { describe, expect, it } from 'vitest';
import { buildYearRecap } from './year-recap';
import type { AugurEntry } from '../types';

let nextId = 0;

function fixture(overrides: Partial<AugurEntry> = {}): AugurEntry {
	return {
		id: `e${nextId++}`,
		kind: 'hunch',
		source: 'gut feeling',
		sourceCategory: 'gut',
		claim: 'something will happen',
		vibe: 'mysterious',
		feltMeaning: null,
		expectedOutcome: null,
		expectedBy: null,
		probability: null,
		outcome: 'fulfilled',
		outcomeNote: null,
		resolvedAt: '2026-02-15T00:00:00Z',
		encounteredAt: '2026-01-15',
		tags: [],
		relatedDreamId: null,
		relatedDecisionId: null,
		livingOracleSnapshot: null,
		isPrivate: true,
		isArchived: false,
		visibility: 'private',
		unlistedToken: '',
		unlistedExpiresAt: null,
		createdAt: '2026-01-15T00:00:00Z',
		updatedAt: '2026-01-15T00:00:00Z',
		...overrides,
	};
}

describe('buildYearRecap — year filter', () => {
	it('includes only entries whose encounteredAt is in the requested year', () => {
		const recap = buildYearRecap(
			[
				fixture({ encounteredAt: '2025-12-31' }),
				fixture({ encounteredAt: '2026-01-01' }),
				fixture({ encounteredAt: '2026-12-31' }),
				fixture({ encounteredAt: '2027-01-01' }),
			],
			2026
		);
		expect(recap.total).toBe(2);
	});

	it('returns empty zero-state when no entries fall in the year', () => {
		const recap = buildYearRecap([fixture({ encounteredAt: '2025-06-01' })], 2030);
		expect(recap.total).toBe(0);
		expect(recap.resolved).toBe(0);
		expect(recap.hitRate).toBeNull();
		expect(recap.bestSource).toBeNull();
		expect(recap.mostFulfilled).toEqual([]);
	});
});

describe('buildYearRecap — distribution', () => {
	it('counts byKind / byVibe / byOutcome', () => {
		const recap = buildYearRecap(
			[
				fixture({ kind: 'omen', vibe: 'good', outcome: 'fulfilled' }),
				fixture({ kind: 'omen', vibe: 'bad', outcome: 'not-fulfilled' }),
				fixture({ kind: 'fortune', vibe: 'mysterious', outcome: 'open' }),
				fixture({ kind: 'hunch', vibe: 'good', outcome: 'partly' }),
			],
			2026
		);
		expect(recap.byKind).toEqual({ omen: 2, fortune: 1, hunch: 1 });
		expect(recap.byVibe).toEqual({ good: 2, bad: 1, mysterious: 1 });
		expect(recap.byOutcome).toEqual({
			open: 1,
			fulfilled: 1,
			partly: 1,
			'not-fulfilled': 1,
		});
	});
});

describe('buildYearRecap — best/worst source eligibility', () => {
	it('only considers source categories with at least 3 resolved entries', () => {
		// 'gut' has 1 resolved → ineligible; 'tarot' has 3 → eligible.
		const recap = buildYearRecap(
			[
				fixture({ sourceCategory: 'gut', outcome: 'fulfilled' }),
				fixture({ sourceCategory: 'tarot', outcome: 'fulfilled' }),
				fixture({ sourceCategory: 'tarot', outcome: 'fulfilled' }),
				fixture({ sourceCategory: 'tarot', outcome: 'not-fulfilled' }),
			],
			2026
		);
		expect(recap.bestSource?.sourceCategory).toBe('tarot');
		expect(recap.worstSource?.sourceCategory).toBe('tarot');
	});

	it('returns null when no source meets the n>=3 threshold', () => {
		const recap = buildYearRecap([fixture({ sourceCategory: 'gut', outcome: 'fulfilled' })], 2026);
		expect(recap.bestSource).toBeNull();
		expect(recap.worstSource).toBeNull();
	});
});

describe('buildYearRecap — mostSurprising', () => {
	it('flags good vibes that did not happen', () => {
		const recap = buildYearRecap(
			[
				fixture({
					vibe: 'good',
					outcome: 'not-fulfilled',
					source: 'goodNotHappen',
				}),
				fixture({ vibe: 'good', outcome: 'fulfilled' }), // not surprising
			],
			2026
		);
		expect(recap.mostSurprising).toHaveLength(1);
		expect(recap.mostSurprising[0]!.source).toBe('goodNotHappen');
	});

	it('flags bad vibes that did happen anyway', () => {
		const recap = buildYearRecap(
			[
				fixture({ vibe: 'bad', outcome: 'fulfilled', source: 'badButHappened' }),
				fixture({ vibe: 'bad', outcome: 'not-fulfilled' }), // not surprising
			],
			2026
		);
		expect(recap.mostSurprising).toHaveLength(1);
		expect(recap.mostSurprising[0]!.source).toBe('badButHappened');
	});

	it('caps at 5 entries', () => {
		const surprising = Array.from({ length: 8 }).map(() =>
			fixture({ vibe: 'good', outcome: 'not-fulfilled' })
		);
		const recap = buildYearRecap(surprising, 2026);
		expect(recap.mostSurprising).toHaveLength(5);
	});
});

describe('buildYearRecap — mostFulfilled', () => {
	it('only includes outcome=fulfilled, ordered by resolvedAt desc', () => {
		const a = fixture({
			outcome: 'fulfilled',
			resolvedAt: '2026-03-01T00:00:00Z',
			source: 'a',
		});
		const b = fixture({
			outcome: 'fulfilled',
			resolvedAt: '2026-06-01T00:00:00Z',
			source: 'b',
		});
		const c = fixture({ outcome: 'partly', source: 'c' });
		const recap = buildYearRecap([a, b, c], 2026);
		expect(recap.mostFulfilled).toHaveLength(2);
		expect(recap.mostFulfilled[0]!.source).toBe('b'); // newest first
		expect(recap.mostFulfilled[1]!.source).toBe('a');
	});
});

describe('buildYearRecap — topCategories', () => {
	it('sorted by sample size desc, capped at 5', () => {
		const entries: AugurEntry[] = [
			...Array.from({ length: 5 }).map(() =>
				fixture({ sourceCategory: 'tarot', outcome: 'fulfilled' })
			),
			...Array.from({ length: 3 }).map(() =>
				fixture({ sourceCategory: 'gut', outcome: 'fulfilled' })
			),
			...Array.from({ length: 2 }).map(() =>
				fixture({ sourceCategory: 'horoscope', outcome: 'fulfilled' })
			),
		];
		const recap = buildYearRecap(entries, 2026);
		expect(recap.topCategories[0]!.category).toBe('tarot');
		expect(recap.topCategories[0]!.n).toBe(5);
		expect(recap.topCategories[1]!.category).toBe('gut');
		expect(recap.topCategories[2]!.category).toBe('horoscope');
	});
});
