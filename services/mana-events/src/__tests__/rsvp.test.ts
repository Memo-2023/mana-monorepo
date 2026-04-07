/**
 * Public RSVP endpoint tests — exercises everything reachable without
 * authentication: snapshot fetch, response submission, validation,
 * upsert dedup, capacity cap and per-token rate limiting.
 *
 * Runs against a real Postgres so the integration with Drizzle and
 * the FK cascade is exercised faithfully.
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { buildTestApp, publicRequest, jsonBody, TEST_USER_ID } from './helpers';
import { eventsPublished } from '../db/schema/events';

const TOKEN = 'TEST_RSVP_TOKEN_001';

const app = buildTestApp();

async function seedSnapshot(overrides: Partial<typeof eventsPublished.$inferInsert> = {}) {
	await app.db.insert(eventsPublished).values({
		token: TOKEN,
		eventId: '00000000-0000-0000-0000-00000000aaaa',
		userId: TEST_USER_ID,
		title: 'Test Party',
		description: 'Bring snacks',
		location: 'Café am See',
		startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
		allDay: false,
		color: '#f43f5e',
		...overrides,
	});
}

async function postRsvp(payload: Record<string, unknown>): Promise<Response> {
	return app.fetch(
		publicRequest(`http://test/api/v1/rsvp/${TOKEN}`, {
			method: 'POST',
			body: jsonBody(payload),
		})
	);
}

beforeEach(async () => {
	await app.wipe();
});

afterAll(async () => {
	await app.wipe();
});

// ─── GET /rsvp/:token ──────────────────────────────────────────────

describe('GET /api/v1/rsvp/:token', () => {
	it('returns the snapshot + zero summary for a fresh event', async () => {
		await seedSnapshot();
		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${TOKEN}`));
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			event: { title: string; location: string; capacity: number | null };
			summary: { yes: number; no: number; maybe: number; totalAttending: number };
		};
		expect(body.event.title).toBe('Test Party');
		expect(body.event.location).toBe('Café am See');
		expect(body.summary).toEqual({ yes: 0, no: 0, maybe: 0, totalAttending: 0 });
	});

	it('returns 404 for an unknown token', async () => {
		const res = await app.fetch(publicRequest('http://test/api/v1/rsvp/NOPE'));
		expect(res.status).toBe(404);
	});

	it('does not leak host userId or individual rsvp identities', async () => {
		await seedSnapshot();
		await postRsvp({ name: 'Alice', email: 'alice@x.test', status: 'yes' });
		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${TOKEN}`));
		const body = await res.json();
		const text = JSON.stringify(body);
		expect(text).not.toContain('alice@x.test');
		expect(text).not.toContain(TEST_USER_ID);
	});

	it('flags a cancelled snapshot via the cancelled boolean', async () => {
		await seedSnapshot({ isCancelled: true });
		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${TOKEN}`));
		const body = (await res.json()) as { cancelled?: boolean };
		expect(body.cancelled).toBe(true);
	});
});

// ─── POST /rsvp/:token — happy path + summary aggregation ─────────

describe('POST /api/v1/rsvp/:token — submit', () => {
	beforeEach(async () => {
		await seedSnapshot();
	});

	it('records a yes RSVP and shows it in the summary', async () => {
		const post = await postRsvp({ name: 'Anna', status: 'yes', plusOnes: 2 });
		expect(post.status).toBe(200);

		const get = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${TOKEN}`));
		const body = (await get.json()) as { summary: { yes: number; totalAttending: number } };
		expect(body.summary.yes).toBe(1);
		expect(body.summary.totalAttending).toBe(3); // 1 + 2 plus-ones
	});

	it('aggregates yes/no/maybe correctly across multiple guests', async () => {
		await postRsvp({ name: 'Anna', status: 'yes', plusOnes: 1 });
		await postRsvp({ name: 'Bob', status: 'no' });
		await postRsvp({ name: 'Carol', status: 'maybe' });
		await postRsvp({ name: 'Dan', status: 'yes' });

		const res = await app.fetch(publicRequest(`http://test/api/v1/rsvp/${TOKEN}`));
		const body = (await res.json()) as {
			summary: { yes: number; no: number; maybe: number; totalAttending: number };
		};
		expect(body.summary).toEqual({
			yes: 2,
			no: 1,
			maybe: 1,
			totalAttending: 3, // 2 yes + 1 plus-one
		});
	});

	it('upserts when the same (name, email) submits twice', async () => {
		await postRsvp({ name: 'Anna', email: 'anna@x.test', status: 'yes', plusOnes: 2 });
		await postRsvp({ name: 'Anna', email: 'anna@x.test', status: 'no', plusOnes: 0 });

		const rows = await app.db.execute<{ status: string; plus_ones: number }>(
			sql`SELECT status, plus_ones FROM events.public_rsvps WHERE token = ${TOKEN}`
		);
		expect(rows.length).toBe(1);
		expect(rows[0]?.status).toBe('no');
		expect(rows[0]?.plus_ones).toBe(0);
	});

	it('treats null vs missing email as the same person', async () => {
		await postRsvp({ name: 'Klaus', status: 'yes' });
		await postRsvp({ name: 'Klaus', email: null, status: 'maybe' });

		const rows = await app.db.execute<{ status: string }>(
			sql`SELECT status FROM events.public_rsvps WHERE token = ${TOKEN} AND name = 'Klaus'`
		);
		expect(rows.length).toBe(1);
		expect(rows[0]?.status).toBe('maybe');
	});

	it('treats different emails as different people', async () => {
		await postRsvp({ name: 'Anna', email: 'a@x.test', status: 'yes' });
		await postRsvp({ name: 'Anna', email: 'b@x.test', status: 'no' });

		const rows = await app.db.execute(
			sql`SELECT * FROM events.public_rsvps WHERE token = ${TOKEN}`
		);
		expect(rows.length).toBe(2);
	});
});

// ─── Validation ────────────────────────────────────────────────────

describe('POST /api/v1/rsvp/:token — validation', () => {
	beforeEach(async () => {
		await seedSnapshot();
	});

	it('rejects a missing name with 400', async () => {
		const res = await postRsvp({ status: 'yes' });
		expect(res.status).toBe(400);
	});

	it('rejects an invalid status enum with 400', async () => {
		const res = await postRsvp({ name: 'X', status: 'definitely-coming' });
		expect(res.status).toBe(400);
	});

	it('rejects a malformed email with 400', async () => {
		const res = await postRsvp({ name: 'X', email: 'not-an-email', status: 'yes' });
		expect(res.status).toBe(400);
	});

	it('rejects an unknown token with 404', async () => {
		const res = await app.fetch(
			publicRequest('http://test/api/v1/rsvp/UNKNOWN', {
				method: 'POST',
				body: jsonBody({ name: 'X', status: 'yes' }),
			})
		);
		expect(res.status).toBe(404);
	});

	it('rejects RSVPs to a cancelled event with 400', async () => {
		await app.db.execute(
			sql`UPDATE events.events_published SET is_cancelled = true WHERE token = ${TOKEN}`
		);
		const res = await postRsvp({ name: 'X', status: 'yes' });
		expect(res.status).toBe(400);
	});

	it('rejects plus-ones outside [0, 20] with 400', async () => {
		const tooMany = await postRsvp({ name: 'X', status: 'yes', plusOnes: 99 });
		expect(tooMany.status).toBe(400);
	});
});

// ─── Capacity + Rate limit caps ────────────────────────────────────

describe('POST /api/v1/rsvp/:token — caps', () => {
	beforeEach(async () => {
		await seedSnapshot();
	});

	it('returns 429 once the per-token hourly rate limit is hit', async () => {
		// TEST_CONFIG.rateLimit.rsvpPerTokenPerHour = 5
		const codes: number[] = [];
		for (let i = 0; i < 7; i++) {
			const res = await postRsvp({ name: `User${i}`, status: 'yes' });
			codes.push(res.status);
		}
		expect(codes.filter((c) => c === 200).length).toBe(5);
		expect(codes.filter((c) => c === 429).length).toBe(2);
	});

	it('returns 429 once the absolute per-token max is reached', async () => {
		// TEST_CONFIG.rateLimit.rsvpMaxPerToken = 20
		// We have to bypass the hourly limit (5/h) by writing rows directly,
		// then the next POST should bounce off the absolute cap.
		const rows = Array.from({ length: 20 }).map((_, i) => ({
			token: TOKEN,
			name: `Bulk${i}`,
			status: 'yes' as const,
		}));
		await app.db.execute(sql`
			INSERT INTO events.public_rsvps (token, name, status)
			SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
				AS x(token text, name text, status text)
		`);

		const res = await postRsvp({ name: 'OneMore', status: 'yes' });
		expect(res.status).toBe(429);
	});
});
