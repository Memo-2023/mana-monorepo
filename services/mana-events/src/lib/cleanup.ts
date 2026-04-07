/**
 * Periodic cleanup of stale rate-limit buckets.
 *
 * Each (token, hour-bucket) row is only useful for the hour it represents
 * — once that hour is over, the row is just dead weight in Postgres.
 * The FK cascade only fires when an event snapshot is deleted; long-lived
 * snapshots therefore accumulate one bucket row per traffic-hour forever.
 *
 * This sweeper deletes any bucket whose hour is more than KEEP_HOURS old.
 * Conservative window so we don't delete a row another request could still
 * read for the same hour boundary in flight.
 */

import { lt, sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { rsvpRateBuckets } from '../db/schema/events';

const KEEP_HOURS = 2;

function cutoffBucket(): string {
	const d = new Date(Date.now() - KEEP_HOURS * 60 * 60 * 1000);
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}`;
}

export async function sweepRateBuckets(db: Database): Promise<number> {
	const cutoff = cutoffBucket();
	const result = await db
		.delete(rsvpRateBuckets)
		.where(lt(rsvpRateBuckets.hourBucket, cutoff))
		.returning({ token: rsvpRateBuckets.token });
	return result.length;
}

/**
 * Start a periodic sweep. Returns a stop function for tests.
 * Runs once on boot, then on the configured interval.
 */
export function startRateBucketSweeper(
	db: Database,
	intervalMs = 60 * 60 * 1000 // 1h
): () => void {
	const tick = async () => {
		try {
			const removed = await sweepRateBuckets(db);
			if (removed > 0) {
				console.log(`[mana-events] swept ${removed} stale rate buckets`);
			}
		} catch (err) {
			console.error('[mana-events] rate bucket sweep failed:', err);
		}
	};

	// Fire once shortly after boot so we don't wait a full hour for the
	// first cleanup, but defer slightly so startup logs aren't interleaved.
	const bootTimer = setTimeout(tick, 5_000);
	const intervalTimer = setInterval(tick, intervalMs);

	return () => {
		clearTimeout(bootTimer);
		clearInterval(intervalTimer);
	};
}
