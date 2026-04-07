/**
 * Host (authenticated) events endpoint tests.
 *
 * Uses the X-Test-User mock auth from helpers.ts so we can switch user
 * identities mid-test to assert ownership behaviour without spinning
 * up a real mana-auth.
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { buildTestApp, authedRequest, jsonBody, TEST_USER_ID, OTHER_USER_ID } from './helpers';

const app = buildTestApp();

const futureIso = (daysAhead: number) =>
	new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

function publishPayload(eventId: string, overrides: Record<string, unknown> = {}) {
	return {
		eventId,
		title: 'Hosted Test',
		description: 'desc',
		location: 'Berlin',
		startAt: futureIso(7),
		endAt: futureIso(7),
		allDay: false,
		color: '#f43f5e',
		...overrides,
	};
}

beforeEach(async () => {
	await app.wipe();
});

afterAll(async () => {
	await app.wipe();
});

// ─── POST /api/v1/events/publish ──────────────────────────────────

describe('POST /api/v1/events/publish', () => {
	it('rejects requests without auth with 401', async () => {
		const res = await app.fetch(
			new Request('http://test/api/v1/events/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: jsonBody(publishPayload('00000000-0000-0000-0000-00000000000a')),
			})
		);
		expect(res.status).toBe(401);
	});

	it('creates a snapshot and returns a 24-char token on first publish', async () => {
		const eventId = '00000000-0000-0000-0000-00000000000a';
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId)),
			})
		);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { token: string; isNew: boolean };
		expect(body.isNew).toBe(true);
		expect(body.token).toBeString();
		expect(body.token.length).toBe(24);

		const rows = await app.db.execute<{ title: string; user_id: string }>(
			sql`SELECT title, user_id FROM events.events_published WHERE event_id = ${eventId}`
		);
		expect(rows.length).toBe(1);
		expect(rows[0]?.title).toBe('Hosted Test');
		expect(rows[0]?.user_id).toBe(TEST_USER_ID);
	});

	it('reuses the existing token when the same event is republished', async () => {
		const eventId = '00000000-0000-0000-0000-00000000000b';
		const first = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId, { title: 'V1' })),
			})
		);
		const { token: token1 } = (await first.json()) as { token: string };

		const second = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId, { title: 'V2' })),
			})
		);
		const { token: token2, isNew } = (await second.json()) as {
			token: string;
			isNew: boolean;
		};

		expect(token2).toBe(token1);
		expect(isNew).toBe(false);

		const rows = await app.db.execute<{ title: string }>(
			sql`SELECT title FROM events.events_published WHERE event_id = ${eventId}`
		);
		expect(rows[0]?.title).toBe('V2');
	});

	it('rejects republishing another user’s event with 403', async () => {
		const eventId = '00000000-0000-0000-0000-00000000000c';
		// User A publishes
		await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId)),
			})
		);

		// User B tries to republish the same event
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				user: OTHER_USER_ID,
				body: jsonBody(publishPayload(eventId)),
			})
		);
		expect(res.status).toBe(403);
	});

	it('rejects payloads missing required fields with 400', async () => {
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody({ title: 'No event id' }),
			})
		);
		expect(res.status).toBe(400);
	});
});

// ─── PUT /api/v1/events/:eventId/snapshot ──────────────────────────

describe('PUT /api/v1/events/:eventId/snapshot', () => {
	const eventId = '00000000-0000-0000-0000-00000000000d';

	beforeEach(async () => {
		await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId, { title: 'Original' })),
			})
		);
	});

	it('updates a single field without touching the others', async () => {
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${eventId}/snapshot`, {
				method: 'PUT',
				body: jsonBody({ eventId, title: 'Renamed' }),
			})
		);
		expect(res.status).toBe(200);

		const rows = await app.db.execute<{ title: string; location: string }>(
			sql`SELECT title, location FROM events.events_published WHERE event_id = ${eventId}`
		);
		expect(rows[0]?.title).toBe('Renamed');
		expect(rows[0]?.location).toBe('Berlin'); // unchanged
	});

	it('rejects updates from non-owners with 403', async () => {
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${eventId}/snapshot`, {
				method: 'PUT',
				user: OTHER_USER_ID,
				body: jsonBody({ eventId, title: 'Hacked' }),
			})
		);
		expect(res.status).toBe(403);
	});

	it('returns 404 when the event was never published', async () => {
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/00000000-0000-0000-0000-00000000ffff/snapshot', {
				method: 'PUT',
				body: jsonBody({ eventId: '00000000-0000-0000-0000-00000000ffff', title: 'X' }),
			})
		);
		expect(res.status).toBe(404);
	});
});

// ─── DELETE /api/v1/events/:eventId ────────────────────────────────

describe('DELETE /api/v1/events/:eventId', () => {
	const eventId = '00000000-0000-0000-0000-00000000000e';

	beforeEach(async () => {
		await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId)),
			})
		);
	});

	it('deletes the snapshot and cascades to RSVPs + rate buckets', async () => {
		const tokenRow = await app.db.execute<{ token: string }>(
			sql`SELECT token FROM events.events_published WHERE event_id = ${eventId}`
		);
		const token = tokenRow[0]!.token;

		// Manually seed a rate bucket and an RSVP for this token
		await app.db.execute(
			sql`INSERT INTO events.public_rsvps (token, name, status) VALUES (${token}, 'X', 'yes')`
		);
		await app.db.execute(
			sql`INSERT INTO events.rsvp_rate_buckets (token, hour_bucket, count) VALUES (${token}, '2026-04-07T12', 1)`
		);

		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${eventId}`, { method: 'DELETE' })
		);
		expect(res.status).toBe(200);

		const counts = await app.db.execute<{
			snapshots: number;
			rsvps: number;
			buckets: number;
		}>(sql`
			SELECT
				(SELECT count(*)::int FROM events.events_published WHERE event_id = ${eventId}) AS snapshots,
				(SELECT count(*)::int FROM events.public_rsvps WHERE token = ${token}) AS rsvps,
				(SELECT count(*)::int FROM events.rsvp_rate_buckets WHERE token = ${token}) AS buckets
		`);
		expect(counts[0]).toEqual({ snapshots: 0, rsvps: 0, buckets: 0 });
	});

	it('returns deleted:false when the event was never published (idempotent)', async () => {
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/00000000-0000-0000-0000-aaaaaaaaaaaa', {
				method: 'DELETE',
			})
		);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { deleted: boolean };
		expect(body.deleted).toBe(false);
	});

	it('rejects deletes from non-owners with 403', async () => {
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${eventId}`, {
				method: 'DELETE',
				user: OTHER_USER_ID,
			})
		);
		expect(res.status).toBe(403);
	});
});

// ─── GET /api/v1/events/:eventId/rsvps ─────────────────────────────

describe('GET /api/v1/events/:eventId/rsvps', () => {
	const eventId = '00000000-0000-0000-0000-00000000000f';

	beforeEach(async () => {
		await app.fetch(
			authedRequest('http://test/api/v1/events/publish', {
				method: 'POST',
				body: jsonBody(publishPayload(eventId)),
			})
		);
	});

	it('returns the host’s RSVPs as a list', async () => {
		const tokenRow = await app.db.execute<{ token: string }>(
			sql`SELECT token FROM events.events_published WHERE event_id = ${eventId}`
		);
		const token = tokenRow[0]!.token;
		await app.db.execute(
			sql`INSERT INTO events.public_rsvps (token, name, status) VALUES (${token}, 'Anna', 'yes')`
		);

		const res = await app.fetch(authedRequest(`http://test/api/v1/events/${eventId}/rsvps`));
		expect(res.status).toBe(200);
		const body = (await res.json()) as { rsvps: { name: string; status: string }[] };
		expect(body.rsvps.length).toBe(1);
		expect(body.rsvps[0]?.name).toBe('Anna');
	});

	it('rejects another user reading the host’s RSVPs with 403', async () => {
		const res = await app.fetch(
			authedRequest(`http://test/api/v1/events/${eventId}/rsvps`, {
				user: OTHER_USER_ID,
			})
		);
		expect(res.status).toBe(403);
	});

	it('returns 404 if the event was never published', async () => {
		const res = await app.fetch(
			authedRequest('http://test/api/v1/events/00000000-0000-0000-0000-bbbbbbbbbbbb/rsvps')
		);
		expect(res.status).toBe(404);
	});
});
