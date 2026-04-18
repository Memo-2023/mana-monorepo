/**
 * Relevance scorer unit tests.
 */

import { describe, it, expect } from 'bun:test';
import { scoreEvent, type ScoredEventInput, type ScoringContext } from '../discovery/scorer';

function makeEvent(overrides: Partial<ScoredEventInput> = {}): ScoredEventInput {
	return {
		title: 'Jazz Night',
		category: 'music',
		lat: 47.997,
		lon: 7.842,
		startAt: new Date(Date.now() + 3 * 86400000), // 3 days from now
		...overrides,
	};
}

function makeContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
	return {
		interests: [
			{ category: 'music', freetext: null, weight: 1.0 },
			{ category: 'tech', freetext: 'Rust', weight: 2.0 },
		],
		regions: [{ lat: 47.997, lon: 7.842, radiusKm: 25 }],
		...overrides,
	};
}

describe('scoreEvent', () => {
	it('returns base score (50) for event with no matches', () => {
		const score = scoreEvent(
			makeEvent({ category: 'other', title: 'Nothing', lat: null, lon: null }),
			makeContext({ interests: [] })
		);
		// Base 50 + time proximity bonus (within 7 days) = ~60
		expect(score).toBeGreaterThanOrEqual(50);
		expect(score).toBeLessThanOrEqual(65);
	});

	it('boosts score for category match', () => {
		const withMatch = scoreEvent(makeEvent({ category: 'music' }), makeContext());
		const noMatch = scoreEvent(makeEvent({ category: 'other' }), makeContext());
		expect(withMatch).toBeGreaterThan(noMatch);
	});

	it('boosts score for freetext match in title', () => {
		// Use no other matching interests to avoid hitting the 100 cap
		const ctx = makeContext({ interests: [{ category: 'other', freetext: 'Rust', weight: 1.0 }] });
		const withMatch = scoreEvent(
			makeEvent({ title: 'Rust Meetup Freiburg', category: 'sport' }),
			ctx
		);
		const noMatch = scoreEvent(makeEvent({ title: 'Python Meetup', category: 'sport' }), ctx);
		expect(withMatch).toBeGreaterThan(noMatch);
	});

	it('applies interest weight', () => {
		const highWeight = scoreEvent(
			makeEvent({ title: 'Rust Talk', category: 'tech' }),
			makeContext({ interests: [{ category: 'tech', freetext: 'Rust', weight: 3.0 }] })
		);
		const lowWeight = scoreEvent(
			makeEvent({ title: 'Rust Talk', category: 'tech' }),
			makeContext({ interests: [{ category: 'tech', freetext: 'Rust', weight: 0.5 }] })
		);
		expect(highWeight).toBeGreaterThan(lowWeight);
	});

	it('penalizes distant events', () => {
		const near = scoreEvent(
			makeEvent({ lat: 47.997, lon: 7.842 }), // same as region center
			makeContext()
		);
		const far = scoreEvent(
			makeEvent({ lat: 48.5, lon: 8.5 }), // ~60km away
			makeContext()
		);
		expect(near).toBeGreaterThan(far);
	});

	it('boosts events within 7 days more than 14 days', () => {
		// Use minimal context to avoid hitting the 100 cap
		const ctx = makeContext({ interests: [] });
		const soon = scoreEvent(
			makeEvent({ startAt: new Date(Date.now() + 3 * 86400000), category: null }),
			ctx
		);
		const later = scoreEvent(
			makeEvent({ startAt: new Date(Date.now() + 10 * 86400000), category: null }),
			ctx
		);
		const farOut = scoreEvent(
			makeEvent({ startAt: new Date(Date.now() + 30 * 86400000), category: null }),
			ctx
		);
		expect(soon).toBeGreaterThan(later);
		expect(later).toBeGreaterThanOrEqual(farOut);
	});

	it('gives weekend bonus', () => {
		// Find the next Saturday
		const now = new Date();
		const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
		const saturday = new Date(now.getTime() + daysUntilSat * 86400000);
		const monday = new Date(saturday.getTime() + 2 * 86400000);

		const weekend = scoreEvent(makeEvent({ startAt: saturday }), makeContext());
		const weekday = scoreEvent(makeEvent({ startAt: monday }), makeContext());
		expect(weekend).toBeGreaterThanOrEqual(weekday);
	});

	it('clamps score to 0-100 range', () => {
		// Lots of matching interests should not exceed 100
		const manyInterests = Array.from({ length: 10 }, (_, i) => ({
			category: 'music',
			freetext: 'jazz',
			weight: 3.0,
		}));
		const score = scoreEvent(
			makeEvent({ title: 'jazz night', category: 'music' }),
			makeContext({ interests: manyInterests })
		);
		expect(score).toBeLessThanOrEqual(100);
		expect(score).toBeGreaterThanOrEqual(0);
	});

	it('handles missing coordinates gracefully', () => {
		const score = scoreEvent(makeEvent({ lat: null, lon: null }), makeContext());
		// Should not crash, just skip distance penalty
		expect(score).toBeGreaterThan(0);
	});
});
