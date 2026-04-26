import { describe, expect, it } from 'vitest';
import {
	mergeMilestones,
	filterByDirection,
	filterByYear,
	compareTimelineDesc,
} from './timeline-query';
import { buildMilestonesRecap } from './year-recap';
import type { First } from '$lib/modules/firsts/types';
import type { Last } from '$lib/modules/lasts/types';

function f(overrides: Partial<First>): First {
	return {
		id: overrides.id ?? 'f1',
		title: overrides.title ?? 'First',
		status: overrides.status ?? 'lived',
		category: overrides.category ?? 'travel',
		motivation: null,
		priority: null,
		date: overrides.date ?? '2026-04-26',
		note: null,
		expectation: null,
		reality: null,
		rating: null,
		wouldRepeat: null,
		personIds: [],
		sharedWith: null,
		mediaIds: [],
		audioNoteId: null,
		placeId: null,
		isPinned: overrides.isPinned ?? false,
		isArchived: false,
		createdAt: overrides.createdAt ?? '2026-04-26T10:00:00Z',
		updatedAt: '2026-04-26T10:00:00Z',
	};
}

function l(overrides: Partial<Last>): Last {
	return {
		id: overrides.id ?? 'l1',
		title: overrides.title ?? 'Last',
		status: overrides.status ?? 'confirmed',
		category: overrides.category ?? 'people',
		confidence: 'certain',
		inferredFrom: null,
		date: overrides.date ?? '2026-04-26',
		meaning: null,
		note: null,
		whatIKnewThen: null,
		whatIKnowNow: null,
		tenderness: null,
		wouldReclaim: null,
		reclaimedAt: null,
		reclaimedNote: null,
		personIds: [],
		sharedWith: null,
		mediaIds: [],
		audioNoteId: null,
		placeId: null,
		recognisedAt: '2026-04-26T10:00:00Z',
		isPinned: overrides.isPinned ?? false,
		isArchived: false,
		visibility: 'private',
		unlistedToken: '',
		unlistedExpiresAt: null,
		createdAt: overrides.createdAt ?? '2026-04-26T10:00:00Z',
		updatedAt: '2026-04-26T10:00:00Z',
	};
}

describe('mergeMilestones', () => {
	it('interleaves firsts and lasts sorted by date desc', () => {
		const merged = mergeMilestones(
			[f({ id: 'a', date: '2025-01-01' }), f({ id: 'b', date: '2026-04-26' })],
			[l({ id: 'c', date: '2025-12-31' })]
		);
		expect(merged.map((e) => e.id)).toEqual(['first:b', 'last:c', 'first:a']);
	});

	it('places pinned entries above unpinned regardless of date', () => {
		const merged = mergeMilestones(
			[f({ id: 'old-pinned', date: '2020-01-01', isPinned: true })],
			[l({ id: 'new', date: '2026-04-01' })]
		);
		expect(merged[0].id).toBe('first:old-pinned');
	});

	it('falls back to createdAt when date is null', () => {
		const merged = mergeMilestones(
			[f({ id: 'dated', date: '2024-01-01' })],
			[l({ id: 'undated', date: null, createdAt: '2026-04-01T00:00:00Z' })]
		);
		expect(merged.map((e) => e.id)).toEqual(['last:undated', 'first:dated']);
	});
});

describe('filterByDirection', () => {
	const merged = mergeMilestones([f({ id: 'a' })], [l({ id: 'b' })]);

	it('passes through with "all"', () => {
		expect(filterByDirection(merged, 'all')).toHaveLength(2);
	});
	it('keeps only firsts', () => {
		expect(filterByDirection(merged, 'first').map((e) => e.id)).toEqual(['first:a']);
	});
	it('keeps only lasts', () => {
		expect(filterByDirection(merged, 'last').map((e) => e.id)).toEqual(['last:b']);
	});
});

describe('filterByYear', () => {
	const merged = mergeMilestones(
		[f({ id: 'a', date: '2024-06-01' }), f({ id: 'b', date: '2026-04-01' })],
		[l({ id: 'c', date: '2025-12-31' })]
	);

	it('keeps only entries from the requested year', () => {
		expect(filterByYear(merged, 2026).map((e) => e.id)).toEqual(['first:b']);
		expect(filterByYear(merged, 2025).map((e) => e.id)).toEqual(['last:c']);
	});
});

describe('buildMilestonesRecap', () => {
	const entries = mergeMilestones(
		[
			f({ id: 'a', date: '2026-01-15', category: 'travel' }),
			f({ id: 'b', date: '2026-04-26', category: 'people' }),
			f({ id: 'c', date: '2025-06-01', category: 'travel' }), // wrong year
		],
		[
			l({ id: 'd', date: '2026-03-10', category: 'people' }),
			l({ id: 'e', date: '2026-12-01', category: 'culinary' }),
		]
	);

	it('counts by direction within the year', () => {
		const recap = buildMilestonesRecap(entries, 2026);
		expect(recap.year).toBe(2026);
		expect(recap.total).toBe(4);
		expect(recap.firsts).toBe(2);
		expect(recap.lasts).toBe(2);
	});

	it('groups by category with both directions counted', () => {
		const recap = buildMilestonesRecap(entries, 2026);
		expect(recap.byCategory.travel).toEqual({ firsts: 1, lasts: 0, total: 1 });
		expect(recap.byCategory.people).toEqual({ firsts: 1, lasts: 1, total: 2 });
		expect(recap.byCategory.culinary).toEqual({ firsts: 0, lasts: 1, total: 1 });
		expect(recap.byCategory.career).toEqual({ firsts: 0, lasts: 0, total: 0 });
	});

	it('returns top firsts/lasts as pre-sorted slices', () => {
		const recap = buildMilestonesRecap(entries, 2026);
		expect(recap.topFirsts.map((e) => e.id)).toEqual(['first:b', 'first:a']);
		expect(recap.topLasts.map((e) => e.id)).toEqual(['last:e', 'last:d']);
	});

	it('lists active months in chronological order', () => {
		const recap = buildMilestonesRecap(entries, 2026);
		expect(recap.activeMonths).toEqual(['2026-01', '2026-03', '2026-04', '2026-12']);
	});
});

describe('compareTimelineDesc', () => {
	it('is a stable comparator', () => {
		const a = mergeMilestones([f({ id: 'a' })], [])[0];
		const b = mergeMilestones([f({ id: 'b' })], [])[0];
		// Same date → comparator returns 0
		expect(compareTimelineDesc(a, b)).toBe(0);
	});
});
