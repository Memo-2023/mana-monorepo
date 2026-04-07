/**
 * Bring-list endpoint tests — host PUT/GET /events/:id/items and the
 * public POST /rsvp/:token/items/:itemId/claim flow.
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import {
	buildTestApp,
	authedRequest,
	publicRequest,
	jsonBody,
	TEST_USER_ID,
	OTHER_USER_ID,
} from './helpers';

const app = buildTestApp();

const futureIso = (daysAhead: number) =>
	new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

const EVENT_ID = '00000000-0000-0000-0000-0000000ffeed';

async function publishEvent(userId = TEST_USER_ID) {
	const res = await app.fetch(
		authedRequest('http://test/api/v1/events/publish', {
			method: 'POST',
			user: userId,
			body: jsonBody({
				eventId: EVENT_ID,
				title: 'Bring test',
				startAt: futureIso(7),
			}),
		})
	);
	const body = (await res.json()) as { token: string };
	return body.token;
}

beforeEach(async () => {
	await app.wipe();
});

afterAll(async () => {
	await app.wipe();
});

// ─── PUT /events/:id/items ────────────────────────────────────────

describe('PUT /api/v1/events/:eventId/items', () => {
	it('rejects unauthenticated callers with 401', async () => {
		const res = await app.fetch(
			new Request(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: jsonBody({ items: [] }),
			})
		);
		expect(res.status).toBe(401);
	});

	it('rejects items for unpublished events with 404', async () => {
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({ items: [{ id: 'a', label: 'A', order: 0 }] }),
			})
		);
		expect(res.status).toBe(404);
	});

	it('inserts new items on first push', async () => {
		await publishEvent();
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({
					items: [
						{ id: 'item-a', label: 'Salat', quantity: 2, order: 0 },
						{ id: 'item-b', label: 'Wein', order: 1 },
					],
				}),
			})
		);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { count: number };
		expect(body.count).toBe(2);

		const get = await app.fetch(authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`));
		const list = (await get.json()) as {
			items: { label: string; quantity: number | null }[];
		};
		expect(list.items.length).toBe(2);
		expect(list.items.map((i) => i.label).sort()).toEqual(['Salat', 'Wein']);
	});

	it('updates existing items in place + deletes ones the host removed', async () => {
		await publishEvent();
		// Initial push
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({
					items: [
						{ id: 'a', label: 'Salat', order: 0 },
						{ id: 'b', label: 'Wein', order: 1 },
					],
				}),
			})
		);
		// Second push: rename a, drop b, add c
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({
					items: [
						{ id: 'a', label: 'Großer Salat', order: 0 },
						{ id: 'c', label: 'Brot', order: 1 },
					],
				}),
			})
		);

		const list = await app.fetch(authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`));
		const body = (await list.json()) as { items: { id: string; label: string }[] };
		expect(body.items.length).toBe(2);
		const byId = new Map(body.items.map((i) => [i.id, i.label]));
		expect(byId.get('a')).toBe('Großer Salat');
		expect(byId.get('c')).toBe('Brot');
		expect(byId.has('b')).toBe(false);
	});

	it('preserves an existing claimed_by_name across host edits', async () => {
		const token = await publishEvent();
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({ items: [{ id: 'a', label: 'Salat', order: 0 }] }),
			})
		);
		// A guest claims it
		await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/a/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'Anna' }),
			})
		);
		// Host renames the item
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({ items: [{ id: 'a', label: 'Großer Salat', order: 0 }] }),
			})
		);

		const rows = await app.db.execute<{ claimed_by_name: string | null }>(
			sql`SELECT claimed_by_name FROM events.event_items_published WHERE id = 'a'`
		);
		expect(rows[0]?.claimed_by_name).toBe('Anna');
	});

	it('rejects attempts to push items for someone else’s event with 403', async () => {
		await publishEvent();
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				user: OTHER_USER_ID,
				body: jsonBody({ items: [{ id: 'x', label: 'Hijack', order: 0 }] }),
			})
		);
		expect(res.status).toBe(403);
	});

	it('rejects payloads with too many items (max 100)', async () => {
		await publishEvent();
		const items = Array.from({ length: 101 }).map((_, i) => ({
			id: `i${i}`,
			label: `Item ${i}`,
			order: i,
		}));
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({ items }),
			})
		);
		expect(res.status).toBe(400);
	});

	it('cascade-deletes items when the snapshot is deleted', async () => {
		await publishEvent();
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({ items: [{ id: 'a', label: 'Salat', order: 0 }] }),
			})
		);
		await app.fetch(authedRequest(`http://test/api/v1/events/${EVENT_ID}`, { method: 'DELETE' }));
		const rows = await app.db.execute<{ count: number }>(
			sql`SELECT count(*)::int AS count FROM events.event_items_published WHERE id = 'a'`
		);
		expect(rows[0]?.count).toBe(0);
	});
});

// ─── GET /rsvp/:token (now also returns items) ────────────────────

describe('GET /api/v1/rsvp/:token (with items)', () => {
	it('exposes the bring list ordered by sort_order', async () => {
		const token = await publishEvent();
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({
					items: [
						{ id: 'b', label: 'Wein', order: 1 },
						{ id: 'a', label: 'Salat', order: 0 },
					],
				}),
			})
		);

		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${token}`));
		const body = (await res.json()) as {
			items: { id: string; label: string; sortOrder: number; claimedByName: string | null }[];
		};
		expect(body.items.length).toBe(2);
		expect(body.items.map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('returns an empty items array when nothing on the list', async () => {
		await publishEvent();
		const token = (
			await app.db.execute<{ token: string }>(
				sql`SELECT token FROM events.events_published WHERE event_id = ${EVENT_ID}`
			)
		)[0]!.token;
		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${token}`));
		const body = (await res.json()) as { items: unknown[] };
		expect(body.items).toEqual([]);
	});
});

// ─── POST /rsvp/:token/items/:itemId/claim ────────────────────────

describe('POST /api/v1/rsvp/:token/items/:itemId/claim', () => {
	let token: string;

	beforeEach(async () => {
		token = await publishEvent();
		await app.fetch(
			authedRequest(`http://test/api/v1/events/${EVENT_ID}/items`, {
				method: 'PUT',
				body: jsonBody({
					items: [
						{ id: 'salat', label: 'Salat', order: 0 },
						{ id: 'wein', label: 'Wein', order: 1 },
					],
				}),
			})
		);
	});

	it('claims an unclaimed item and stores the name', async () => {
		const res = await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'Anna' }),
			})
		);
		expect(res.status).toBe(200);

		const get = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${token}`));
		const body = (await get.json()) as {
			items: { id: string; claimedByName: string | null }[];
		};
		expect(body.items.find((i) => i.id === 'salat')?.claimedByName).toBe('Anna');
	});

	it('rejects a second claim on the same item with 400', async () => {
		await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'Anna' }),
			})
		);
		const res = await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'Bob' }),
			})
		);
		expect(res.status).toBe(400);
	});

	it('rejects claiming an item from a different token with 404', async () => {
		// Seed a second event
		const secondEventId = '00000000-0000-0000-0000-000000ffeed1';
		const secondTokenRes = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody({
					eventId: secondEventId,
					title: 'Other event',
					startAt: futureIso(14),
				}),
			})
		);
		const { token: otherToken } = (await secondTokenRes.json()) as { token: string };

		// Try to claim "salat" (which belongs to the FIRST token) via the other token
		const res = await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${otherToken}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'X' }),
			})
		);
		expect(res.status).toBe(404);
	});

	it('rejects claims to a cancelled event with 400', async () => {
		await app.db.execute(
			sql`UPDATE events.events_published SET is_cancelled = true WHERE token = ${token}`
		);
		const res = await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({ name: 'Anna' }),
			})
		);
		expect(res.status).toBe(400);
	});

	it('rejects malformed bodies with 400', async () => {
		const res = await app.fetch(
			publicRequest(`http://test/api/v1/rsvp/${token}/items/salat/claim`, {
				method: 'POST',
				body: jsonBody({}),
			})
		);
		expect(res.status).toBe(400);
	});
});
