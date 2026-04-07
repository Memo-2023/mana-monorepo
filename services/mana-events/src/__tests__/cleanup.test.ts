/**
 * Rate-bucket sweeper unit test.
 *
 * Inserts a couple of historical buckets and one fresh bucket, runs
 * sweepRateBuckets, and asserts only the historical ones disappear.
 *
 * Bucket rows have a FK to events_published.token, so we seed a
 * snapshot first to keep the FK happy.
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { buildTestApp, TEST_USER_ID } from './helpers';
import { sweepRateBuckets } from '../lib/cleanup';
import { eventsPublished, rsvpRateBuckets } from '../db/schema/events';

const app = buildTestApp();
const TOKEN = 'TEST_SWEEP_TOKEN';

beforeEach(async () => {
	await app.wipe();
	await app.db.insert(eventsPublished).values({
		token: TOKEN,
		eventId: '00000000-0000-0000-0000-00000000beef',
		userId: TEST_USER_ID,
		title: 'Sweeper fixture',
		startAt: new Date(),
	});
});

afterAll(async () => {
	await app.wipe();
});

function bucketLabel(hoursAgo: number): string {
	const d = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}`;
}

describe('sweepRateBuckets', () => {
	it('removes buckets older than 2h and keeps recent ones', async () => {
		await app.db.insert(rsvpRateBuckets).values([
			{ token: TOKEN, hourBucket: bucketLabel(0), count: 1 }, // current hour — keep
			{ token: TOKEN, hourBucket: bucketLabel(1), count: 1 }, // 1h ago — keep
			{ token: TOKEN, hourBucket: bucketLabel(3), count: 1 }, // 3h ago — drop
			{ token: TOKEN, hourBucket: bucketLabel(24), count: 1 }, // 1d ago — drop
		]);

		const removed = await sweepRateBuckets(app.db);
		expect(removed).toBe(2);

		const remaining = await app.db.execute<{ hour_bucket: string }>(
			sql`SELECT hour_bucket FROM events.rsvp_rate_buckets WHERE token = ${TOKEN} ORDER BY hour_bucket`
		);
		expect(remaining.length).toBe(2);
		// The two surviving buckets should both be within the last 2h
		expect(remaining.map((r) => r.hour_bucket)).toEqual([bucketLabel(1), bucketLabel(0)]);
	});

	it('returns 0 when there is nothing stale to remove', async () => {
		await app.db.insert(rsvpRateBuckets).values({
			token: TOKEN,
			hourBucket: bucketLabel(0),
			count: 1,
		});

		const removed = await sweepRateBuckets(app.db);
		expect(removed).toBe(0);
	});

	it('handles an empty table without throwing', async () => {
		const removed = await sweepRateBuckets(app.db);
		expect(removed).toBe(0);
	});
});
