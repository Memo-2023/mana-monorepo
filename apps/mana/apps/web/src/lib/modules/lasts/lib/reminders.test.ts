import { describe, expect, it } from 'vitest';
import {
	findAnniversaryLasts,
	findRecognitionAnniversaryLasts,
	isSameDayOfYear,
	yearsBetween,
} from './reminders';
import type { Last } from '../types';

function makeLast(overrides: Partial<Last> = {}): Last {
	return {
		id: overrides.id ?? 'l1',
		title: overrides.title ?? 'Test',
		status: overrides.status ?? 'confirmed',
		category: overrides.category ?? 'other',
		confidence: overrides.confidence ?? 'certain',
		inferredFrom: overrides.inferredFrom ?? null,
		date: overrides.date ?? null,
		meaning: overrides.meaning ?? null,
		note: overrides.note ?? null,
		whatIKnewThen: overrides.whatIKnewThen ?? null,
		whatIKnowNow: overrides.whatIKnowNow ?? null,
		tenderness: overrides.tenderness ?? null,
		wouldReclaim: overrides.wouldReclaim ?? null,
		reclaimedAt: overrides.reclaimedAt ?? null,
		reclaimedNote: overrides.reclaimedNote ?? null,
		personIds: overrides.personIds ?? [],
		sharedWith: overrides.sharedWith ?? null,
		mediaIds: overrides.mediaIds ?? [],
		audioNoteId: overrides.audioNoteId ?? null,
		placeId: overrides.placeId ?? null,
		recognisedAt: overrides.recognisedAt ?? '2026-04-26T10:00:00Z',
		isPinned: overrides.isPinned ?? false,
		isArchived: overrides.isArchived ?? false,
		visibility: overrides.visibility ?? 'private',
		unlistedToken: overrides.unlistedToken ?? '',
		unlistedExpiresAt: overrides.unlistedExpiresAt ?? null,
		createdAt: overrides.createdAt ?? '2026-04-26T10:00:00Z',
		updatedAt: overrides.updatedAt ?? '2026-04-26T10:00:00Z',
	};
}

describe('isSameDayOfYear', () => {
	it('matches same month-day in earlier year', () => {
		expect(isSameDayOfYear('2024-04-26', '2026-04-26')).toBe(true);
	});

	it('rejects same year (no anniversary on the day it happened)', () => {
		expect(isSameDayOfYear('2026-04-26', '2026-04-26')).toBe(false);
	});

	it('rejects different month-day', () => {
		expect(isSameDayOfYear('2024-04-25', '2026-04-26')).toBe(false);
		expect(isSameDayOfYear('2024-05-26', '2026-04-26')).toBe(false);
	});

	it('rejects future dates', () => {
		expect(isSameDayOfYear('2030-04-26', '2026-04-26')).toBe(false);
	});

	it('handles ISO timestamps too', () => {
		expect(isSameDayOfYear('2024-04-26T10:00:00Z', '2026-04-26')).toBe(true);
	});

	it('rejects malformed input', () => {
		expect(isSameDayOfYear('not-a-date', '2026-04-26')).toBe(false);
		expect(isSameDayOfYear('', '2026-04-26')).toBe(false);
	});
});

describe('yearsBetween', () => {
	it('counts whole-year diff (ignores month-day)', () => {
		expect(yearsBetween('2024-12-31', '2026-04-26')).toBe(2);
		expect(yearsBetween('2024-01-01', '2026-04-26')).toBe(2);
	});

	it('returns 0 for malformed input', () => {
		expect(yearsBetween('xx', '2026-04-26')).toBe(0);
	});
});

describe('findAnniversaryLasts', () => {
	const today = '2026-04-26';

	it('surfaces confirmed lasts whose date hits today', () => {
		const a = makeLast({ id: 'a', status: 'confirmed', date: '2024-04-26' });
		const b = makeLast({ id: 'b', status: 'confirmed', date: '2025-04-26' });
		const c = makeLast({ id: 'c', status: 'confirmed', date: '2024-04-25' });
		const result = findAnniversaryLasts([a, b, c], today);
		expect(result.map((l) => l.id).sort()).toEqual(['a', 'b']);
	});

	it('skips suspected and reclaimed', () => {
		const sus = makeLast({ id: 'sus', status: 'suspected', date: '2024-04-26' });
		const rec = makeLast({ id: 'rec', status: 'reclaimed', date: '2024-04-26' });
		const conf = makeLast({ id: 'conf', status: 'confirmed', date: '2024-04-26' });
		const result = findAnniversaryLasts([sus, rec, conf], today);
		expect(result.map((l) => l.id)).toEqual(['conf']);
	});

	it('skips lasts without a date', () => {
		const noDate = makeLast({ id: 'x', status: 'confirmed', date: null });
		expect(findAnniversaryLasts([noDate], today)).toEqual([]);
	});
});

describe('findRecognitionAnniversaryLasts', () => {
	const today = '2026-04-26';

	it('surfaces lasts where recognisedAt hits today, regardless of status', () => {
		const sus = makeLast({
			id: 'sus',
			status: 'suspected',
			recognisedAt: '2024-04-26T08:00:00Z',
		});
		const rec = makeLast({
			id: 'rec',
			status: 'reclaimed',
			recognisedAt: '2025-04-26T08:00:00Z',
		});
		const off = makeLast({
			id: 'off',
			status: 'confirmed',
			recognisedAt: '2024-03-15T08:00:00Z',
		});
		const result = findRecognitionAnniversaryLasts([sus, rec, off], today);
		expect(result.map((l) => l.id).sort()).toEqual(['rec', 'sus']);
	});
});
