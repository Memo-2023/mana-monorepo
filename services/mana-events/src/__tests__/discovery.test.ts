/**
 * Discovery route integration tests.
 *
 * Tests CRUD for regions, interests, sources, and the feed endpoint.
 * Uses the same mock-auth pattern as existing mana-events tests.
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { buildTestApp, authedRequest, jsonBody, TEST_USER_ID, OTHER_USER_ID } from './helpers';

const app = buildTestApp();

const BASE = 'http://test/api/v1/discovery';

beforeEach(async () => {
	await app.wipe();
});

afterAll(async () => {
	await app.wipe();
});

// ─── Helper ─────────────────────────────────────────────────────────

async function createRegion(label = 'Freiburg', lat = 47.997, lon = 7.842, user = TEST_USER_ID) {
	const res = await app.fetch(
		authedRequest(`${BASE}/regions`, {
			method: 'POST',
			body: jsonBody({ label, lat, lon, radiusKm: 25 }),
			user,
		})
	);
	expect(res.status).toBe(201);
	const data = await res.json();
	return data.region;
}

// ─── Regions ────────────────────────────────────────────────────────

describe('Discovery Regions', () => {
	it('creates a region', async () => {
		const region = await createRegion();
		expect(region.label).toBe('Freiburg');
		expect(region.lat).toBe(47.997);
		expect(region.lon).toBe(7.842);
		expect(region.radiusKm).toBe(25);
		expect(region.isActive).toBe(true);
	});

	it('lists only own regions', async () => {
		await createRegion('Freiburg', 47.997, 7.842, TEST_USER_ID);
		await createRegion('Basel', 47.559, 7.589, OTHER_USER_ID);

		const res = await app.fetch(authedRequest(`${BASE}/regions`));
		const { regions } = await res.json();
		expect(regions).toHaveLength(1);
		expect(regions[0].label).toBe('Freiburg');
	});

	it('updates a region', async () => {
		const region = await createRegion();
		const res = await app.fetch(
			authedRequest(`${BASE}/regions/${region.id}`, {
				method: 'PUT',
				body: jsonBody({ radiusKm: 50, label: 'Freiburg im Breisgau' }),
			})
		);
		expect(res.status).toBe(200);
		const { region: updated } = await res.json();
		expect(updated.radiusKm).toBe(50);
		expect(updated.label).toBe('Freiburg im Breisgau');
	});

	it('rejects updating another user region', async () => {
		const region = await createRegion('Basel', 47.559, 7.589, OTHER_USER_ID);
		const res = await app.fetch(
			authedRequest(`${BASE}/regions/${region.id}`, {
				method: 'PUT',
				body: jsonBody({ radiusKm: 100 }),
			})
		);
		expect(res.status).toBe(404);
	});

	it('deletes a region (cascades to sources)', async () => {
		const region = await createRegion();
		const delRes = await app.fetch(
			authedRequest(`${BASE}/regions/${region.id}`, { method: 'DELETE' })
		);
		expect(delRes.status).toBe(200);

		const listRes = await app.fetch(authedRequest(`${BASE}/regions`));
		const { regions } = await listRes.json();
		expect(regions).toHaveLength(0);
	});

	it('rejects invalid coordinates', async () => {
		const res = await app.fetch(
			authedRequest(`${BASE}/regions`, {
				method: 'POST',
				body: jsonBody({ label: 'Bad', lat: 999, lon: 7.0 }),
			})
		);
		expect(res.status).toBe(400);
	});
});

// ─── Interests ──────────────────────────────────────────────────────

describe('Discovery Interests', () => {
	it('creates and lists interests', async () => {
		const res1 = await app.fetch(
			authedRequest(`${BASE}/interests`, {
				method: 'POST',
				body: jsonBody({ category: 'music' }),
			})
		);
		expect(res1.status).toBe(201);

		const res2 = await app.fetch(
			authedRequest(`${BASE}/interests`, {
				method: 'POST',
				body: jsonBody({ category: 'tech', freetext: 'Rust Meetups', weight: 2.0 }),
			})
		);
		expect(res2.status).toBe(201);

		const listRes = await app.fetch(authedRequest(`${BASE}/interests`));
		const { interests } = await listRes.json();
		expect(interests).toHaveLength(2);
		expect(interests.find((i: { category: string }) => i.category === 'tech').freetext).toBe(
			'Rust Meetups'
		);
		expect(interests.find((i: { category: string }) => i.category === 'tech').weight).toBe(2.0);
	});

	it('deletes an interest', async () => {
		const createRes = await app.fetch(
			authedRequest(`${BASE}/interests`, {
				method: 'POST',
				body: jsonBody({ category: 'sport' }),
			})
		);
		const { interest } = await createRes.json();

		const delRes = await app.fetch(
			authedRequest(`${BASE}/interests/${interest.id}`, { method: 'DELETE' })
		);
		expect(delRes.status).toBe(200);

		const listRes = await app.fetch(authedRequest(`${BASE}/interests`));
		const { interests } = await listRes.json();
		expect(interests).toHaveLength(0);
	});
});

// ─── Sources ────────────────────────────────────────────────────────

describe('Discovery Sources', () => {
	it('creates a source linked to a region', async () => {
		const region = await createRegion();
		const res = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://example.com/events.ics',
					name: 'Test Venue',
					regionId: region.id,
				}),
			})
		);
		expect(res.status).toBe(201);
		const { source } = await res.json();
		expect(source.name).toBe('Test Venue');
		expect(source.type).toBe('ical');
		expect(source.regionId).toBe(region.id);
		expect(source.isActive).toBe(true);
		expect(source.errorCount).toBe(0);
	});

	it('rejects source with invalid region', async () => {
		const res = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://example.com/events.ics',
					name: 'Bad',
					regionId: '00000000-0000-0000-0000-000000000000',
				}),
			})
		);
		expect(res.status).toBe(400);
	});

	it('rejects source for another user region', async () => {
		const region = await createRegion('Basel', 47.559, 7.589, OTHER_USER_ID);
		const res = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://example.com/events.ics',
					name: 'Sneaky',
					regionId: region.id,
				}),
			})
		);
		expect(res.status).toBe(400);
	});

	it('lists only own sources', async () => {
		const region1 = await createRegion('FR', 47.997, 7.842, TEST_USER_ID);
		const region2 = await createRegion('BS', 47.559, 7.589, OTHER_USER_ID);

		await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://a.com/cal.ics',
					name: 'A',
					regionId: region1.id,
				}),
			})
		);
		await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://b.com/cal.ics',
					name: 'B',
					regionId: region2.id,
				}),
				user: OTHER_USER_ID,
			})
		);

		const res = await app.fetch(authedRequest(`${BASE}/sources`));
		const { sources } = await res.json();
		expect(sources).toHaveLength(1);
		expect(sources[0].name).toBe('A');
	});

	it('deletes a source', async () => {
		const region = await createRegion();
		const createRes = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://x.com/cal.ics',
					name: 'X',
					regionId: region.id,
				}),
			})
		);
		const { source } = await createRes.json();

		const delRes = await app.fetch(
			authedRequest(`${BASE}/sources/${source.id}`, { method: 'DELETE' })
		);
		expect(delRes.status).toBe(200);
	});
});

// ─── Feed ───────────────────────────────────────────────────────────

describe('Discovery Feed', () => {
	it('returns empty feed when no sources exist', async () => {
		await createRegion();
		const res = await app.fetch(authedRequest(`${BASE}/feed`));
		expect(res.status).toBe(200);
		const { events, hasMore } = await res.json();
		expect(events).toHaveLength(0);
		expect(hasMore).toBe(false);
	});

	it('records save action', async () => {
		const region = await createRegion();

		// Insert a discovered event directly to test the action endpoint
		const { sql: rawSql } = await import('drizzle-orm');
		const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();

		// First create a source so we have a source_id for the FK
		const srcRes = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://test.com/cal.ics',
					name: 'Test',
					regionId: region.id,
				}),
			})
		);
		const { source } = await srcRes.json();

		// Insert event directly into DB
		await app.db.execute(
			rawSql`INSERT INTO event_discovery.discovered_events
				(id, source_id, dedupe_hash, title, start_at, source_url, crawled_at)
				VALUES (
					'00000000-0000-0000-0000-000000000001',
					${source.id}::uuid,
					'testhash123',
					'Test Event',
					${futureDate}::timestamptz,
					'https://example.com/event',
					now()
				)`
		);

		// Record action
		const actionRes = await app.fetch(
			authedRequest(`${BASE}/feed/00000000-0000-0000-0000-000000000001/action`, {
				method: 'POST',
				body: jsonBody({ action: 'save' }),
			})
		);
		expect(actionRes.status).toBe(200);

		// Verify the action shows in feed
		const feedRes = await app.fetch(authedRequest(`${BASE}/feed`));
		const { events } = await feedRes.json();
		expect(events).toHaveLength(1);
		expect(events[0].userAction).toBe('save');
	});

	it('dismiss action + hideDismissed filters events', async () => {
		const region = await createRegion();
		const { sql: rawSql } = await import('drizzle-orm');
		const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();

		const srcRes = await app.fetch(
			authedRequest(`${BASE}/sources`, {
				method: 'POST',
				body: jsonBody({
					type: 'ical',
					url: 'https://test.com/cal.ics',
					name: 'Test',
					regionId: region.id,
				}),
			})
		);
		const { source } = await srcRes.json();

		await app.db.execute(
			rawSql`INSERT INTO event_discovery.discovered_events
				(id, source_id, dedupe_hash, title, start_at, source_url, crawled_at)
				VALUES (
					'00000000-0000-0000-0000-000000000002',
					${source.id}::uuid,
					'hash-dismiss',
					'Dismissed Event',
					${futureDate}::timestamptz,
					'https://example.com/ev2',
					now()
				)`
		);

		// Dismiss
		await app.fetch(
			authedRequest(`${BASE}/feed/00000000-0000-0000-0000-000000000002/action`, {
				method: 'POST',
				body: jsonBody({ action: 'dismiss' }),
			})
		);

		// Without hideDismissed — shows up
		const res1 = await app.fetch(authedRequest(`${BASE}/feed`));
		const data1 = await res1.json();
		expect(data1.events).toHaveLength(1);
		expect(data1.events[0].userAction).toBe('dismiss');

		// With hideDismissed — filtered out
		const res2 = await app.fetch(authedRequest(`${BASE}/feed?hideDismissed=true`));
		const data2 = await res2.json();
		expect(data2.events).toHaveLength(0);
	});

	it('rejects unauthenticated requests', async () => {
		const res = await app.fetch(new Request(`${BASE}/feed`));
		expect(res.status).toBe(401);
	});
});
