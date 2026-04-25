/**
 * Augur — Living Oracle.
 *
 * Pure-math fingerprint + match + reflection. Cold-start gates are
 * the riskiest contract — getting them wrong means the engine speaks
 * before it has learned anything (or stays silent forever). Both
 * thresholds are tested explicitly.
 */

import { describe, expect, it } from 'vitest';
import {
	LIVING_ORACLE_COLD_START_MIN,
	LIVING_ORACLE_MIN_MATCHES,
	LIVING_ORACLE_MIN_SCORE,
	extractKeywords,
	findMatches,
	fingerprint,
	makeReflection,
	matchScore,
	shouldSpeak,
} from './living-oracle';
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
		resolvedAt: '2026-01-15T00:00:00Z',
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

describe('extractKeywords', () => {
	it('drops words shorter than 4 chars', () => {
		expect(extractKeywords('I am a fox')).toEqual(new Set());
	});

	it('lowercases + dedups', () => {
		const kw = extractKeywords('Wassertraum WASSERTRAUM ueber Bruecke');
		expect(kw.has('wassertraum')).toBe(true);
		expect(kw.has('bruecke')).toBe(true);
		expect(kw.size).toBe(2);
	});

	it('drops common German + English stop words', () => {
		// Every word in this set is on the stop list — none should survive.
		const kw = extractKeywords('this that have with from they will been');
		expect(kw.size).toBe(0);
	});

	it('keeps content words alongside dropped stop words', () => {
		const kw = extractKeywords('this Wassertraum that Bruecke');
		expect(kw.size).toBe(2);
		expect(kw.has('wassertraum')).toBe(true);
		expect(kw.has('bruecke')).toBe(true);
	});

	it('strips punctuation but keeps umlauts (NFKD-normalised)', () => {
		const kw = extractKeywords('Bruecke! Bruecke?');
		expect(kw.has('bruecke')).toBe(true);
	});
});

describe('fingerprint', () => {
	it('returns null when any required component is missing', () => {
		expect(fingerprint({ kind: 'omen' })).toBeNull();
		expect(fingerprint({ kind: 'omen', sourceCategory: 'natural' })).toBeNull();
		expect(fingerprint({})).toBeNull();
	});

	it('lowercases tags + extracts source/claim keywords', () => {
		const fp = fingerprint({
			kind: 'omen',
			sourceCategory: 'natural',
			vibe: 'good',
			tags: ['Arbeit', 'arbeit', 'Naturzeichen'],
			source: 'Doppelter Regenbogen',
			claim: 'Ein guter Tag steht bevor',
		})!;
		expect(fp.tags.size).toBe(2);
		expect(fp.tags.has('arbeit')).toBe(true);
		expect(fp.keywords.has('regenbogen')).toBe(true);
	});
});

describe('matchScore', () => {
	const base = fingerprint({
		kind: 'omen',
		sourceCategory: 'natural',
		vibe: 'good',
		tags: ['arbeit'],
		source: 'Regenbogen',
		claim: 'guter Tag',
	})!;

	it('all 5 components match → score 5', () => {
		const same = fingerprint({
			kind: 'omen',
			sourceCategory: 'natural',
			vibe: 'good',
			tags: ['arbeit'],
			source: 'Regenbogen',
			claim: 'guter Tag',
		})!;
		expect(matchScore(base, same)).toBe(5);
	});

	it('zero overlap → score 0', () => {
		const other = fingerprint({
			kind: 'hunch',
			sourceCategory: 'fortune-cookie',
			vibe: 'bad',
			tags: ['privat'],
			source: 'Glueckskeks',
			claim: 'Vorsicht im Verkehr',
		})!;
		expect(matchScore(base, other)).toBe(0);
	});

	it('partial overlap respects MIN_SCORE threshold', () => {
		const partial = fingerprint({
			kind: 'omen', // +1
			sourceCategory: 'fortune-cookie',
			vibe: 'good', // +1
			tags: ['privat'],
			source: 'andere',
			claim: 'andere',
		})!;
		expect(matchScore(base, partial)).toBe(2);
		expect(matchScore(base, partial)).toBeGreaterThanOrEqual(LIVING_ORACLE_MIN_SCORE);
	});
});

describe('findMatches', () => {
	const input = fingerprint({
		kind: 'omen',
		sourceCategory: 'natural',
		vibe: 'good',
		tags: ['arbeit'],
	})!;

	it('only counts resolved past entries — never open', () => {
		const history = [
			fixture({ kind: 'omen', sourceCategory: 'natural', vibe: 'good', outcome: 'open' }),
			fixture({ kind: 'omen', sourceCategory: 'natural', vibe: 'good', outcome: 'fulfilled' }),
		];
		const set = findMatches(input, history);
		expect(set.n).toBe(1);
	});

	it('honours the score>=2 threshold', () => {
		const history = [
			// kind matches, sourceCategory + vibe match → score 3 → counts
			fixture({ kind: 'omen', sourceCategory: 'natural', vibe: 'good', outcome: 'fulfilled' }),
			// only kind matches → score 1 → skipped
			fixture({
				kind: 'omen',
				sourceCategory: 'fortune-cookie',
				vibe: 'bad',
				outcome: 'fulfilled',
			}),
		];
		const set = findMatches(input, history);
		expect(set.n).toBe(1);
	});

	it('exclude-id keeps the engine from scoring against itself', () => {
		const self = fixture({
			id: 'self',
			kind: 'omen',
			sourceCategory: 'natural',
			vibe: 'good',
			outcome: 'fulfilled',
		});
		const set = findMatches(input, [self], 'self');
		expect(set.n).toBe(0);
	});

	it('breakdown counts fulfilled / partly / not-fulfilled', () => {
		const history = [
			fixture({ kind: 'omen', sourceCategory: 'natural', vibe: 'good', outcome: 'fulfilled' }),
			fixture({ kind: 'omen', sourceCategory: 'natural', vibe: 'good', outcome: 'partly' }),
			fixture({
				kind: 'omen',
				sourceCategory: 'natural',
				vibe: 'good',
				outcome: 'not-fulfilled',
			}),
		];
		const set = findMatches(input, history);
		expect(set.n).toBe(3);
		expect(set.fulfilled).toBe(1);
		expect(set.partly).toBe(1);
		expect(set.notFulfilled).toBe(1);
		expect(set.hitRate).toBeCloseTo(0.5, 5);
	});
});

describe('shouldSpeak (cold-start gates)', () => {
	const someSet = {
		matches: [],
		n: LIVING_ORACLE_MIN_MATCHES,
		hitRate: 0.5,
		fulfilled: 0,
		partly: 0,
		notFulfilled: 0,
	};

	it('refuses to speak below the cold-start threshold', () => {
		expect(shouldSpeak(LIVING_ORACLE_COLD_START_MIN - 1, someSet)).toBe(false);
	});

	it('refuses to speak below the min-matches threshold', () => {
		expect(
			shouldSpeak(LIVING_ORACLE_COLD_START_MIN, {
				...someSet,
				n: LIVING_ORACLE_MIN_MATCHES - 1,
			})
		).toBe(false);
	});

	it('speaks once both thresholds are met', () => {
		expect(shouldSpeak(LIVING_ORACLE_COLD_START_MIN, someSet)).toBe(true);
	});
});

describe('makeReflection', () => {
	it('returns null when matches < min threshold', () => {
		expect(
			makeReflection({
				matches: [],
				n: LIVING_ORACLE_MIN_MATCHES - 1,
				hitRate: 1,
				fulfilled: 0,
				partly: 0,
				notFulfilled: 0,
			})
		).toBeNull();
	});

	it('emits the n / hit-rate / breakdown phrases', () => {
		const text = makeReflection({
			matches: [],
			n: 5,
			hitRate: 0.6,
			fulfilled: 3,
			partly: 0,
			notFulfilled: 2,
		})!;
		expect(text).toContain('5 aehnliche');
		expect(text).toContain('60%');
		expect(text).toContain('3 eingetreten');
		expect(text).toContain('2 nicht eingetreten');
		expect(text).not.toContain('teilweise'); // 0 partly → not surfaced
	});

	it('rounds the hit-rate to integer percent', () => {
		const text = makeReflection({
			matches: [],
			n: 3,
			hitRate: 0.6666,
			fulfilled: 2,
			partly: 0,
			notFulfilled: 1,
		})!;
		expect(text).toContain('67%');
	});
});
