/**
 * Deduplicator unit tests — no DB required.
 */

import { describe, it, expect } from 'bun:test';
import { computeDedupeHash } from '../discovery/deduplicator';
import type { NormalizedEvent } from '../discovery/types';

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
	return {
		title: 'Jazz Night',
		startAt: new Date('2026-05-01T19:00:00Z'),
		sourceUrl: 'https://example.com/event',
		location: 'Jazzhaus Freiburg',
		...overrides,
	};
}

describe('computeDedupeHash', () => {
	it('produces a hex string', async () => {
		const hash = await computeDedupeHash(makeEvent());
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('is deterministic (same input = same hash)', async () => {
		const a = await computeDedupeHash(makeEvent());
		const b = await computeDedupeHash(makeEvent());
		expect(a).toBe(b);
	});

	it('differs when title changes', async () => {
		const a = await computeDedupeHash(makeEvent({ title: 'Jazz Night' }));
		const b = await computeDedupeHash(makeEvent({ title: 'Rock Night' }));
		expect(a).not.toBe(b);
	});

	it('differs when date changes', async () => {
		const a = await computeDedupeHash(makeEvent({ startAt: new Date('2026-05-01T19:00:00Z') }));
		const b = await computeDedupeHash(makeEvent({ startAt: new Date('2026-05-02T19:00:00Z') }));
		expect(a).not.toBe(b);
	});

	it('differs when location changes', async () => {
		const a = await computeDedupeHash(makeEvent({ location: 'Jazzhaus Freiburg' }));
		const b = await computeDedupeHash(makeEvent({ location: 'E-Werk Freiburg' }));
		expect(a).not.toBe(b);
	});

	it('is case-insensitive (title)', async () => {
		const a = await computeDedupeHash(makeEvent({ title: 'Jazz Night' }));
		const b = await computeDedupeHash(makeEvent({ title: 'jazz night' }));
		expect(a).toBe(b);
	});

	it('is case-insensitive (location)', async () => {
		const a = await computeDedupeHash(makeEvent({ location: 'Jazzhaus Freiburg' }));
		const b = await computeDedupeHash(makeEvent({ location: 'jazzhaus freiburg' }));
		expect(a).toBe(b);
	});

	it('treats null and empty location the same', async () => {
		const a = await computeDedupeHash(makeEvent({ location: null }));
		const b = await computeDedupeHash(makeEvent({ location: '' }));
		expect(a).toBe(b);
	});

	it('ignores time-of-day (same calendar date = same hash)', async () => {
		const a = await computeDedupeHash(makeEvent({ startAt: new Date('2026-05-01T10:00:00Z') }));
		const b = await computeDedupeHash(makeEvent({ startAt: new Date('2026-05-01T22:00:00Z') }));
		expect(a).toBe(b);
	});

	it('trims whitespace from title and location', async () => {
		const a = await computeDedupeHash(
			makeEvent({ title: '  Jazz Night  ', location: '  Jazzhaus  ' })
		);
		const b = await computeDedupeHash(makeEvent({ title: 'Jazz Night', location: 'Jazzhaus' }));
		expect(a).toBe(b);
	});
});
