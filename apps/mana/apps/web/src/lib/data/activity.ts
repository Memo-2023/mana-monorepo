/**
 * Local activity log — legacy read API.
 *
 * @deprecated The `_activity` table is no longer written to (replaced by
 * the Domain Event Store in `data/events/`). This module now delegates
 * `getRecentActivity()` to `queryEvents()` from the event store,
 * converting the richer domain events back to the old ActivityEntry shape
 * for backward compatibility with any remaining consumers.
 *
 * New code should use `queryEvents()` directly.
 */

import { db } from './database';
import { getEffectiveUserId } from './current-user';
import { queryEvents } from './events/event-store';

export type ActivityOp = 'insert' | 'update' | 'delete';

export interface ActivityEntry {
	/** Auto-incremented primary key. */
	id?: number;
	/** ISO timestamp of the write. */
	createdAt: string;
	appId: string;
	collection: string;
	recordId: string;
	op: ActivityOp;
	/** User who performed the write — auto-stamped from getEffectiveUserId. */
	userId: string;
}

/** Maximum entries kept in the activity log. Older rows pruned by FIFO. */
export const ACTIVITY_MAX_ENTRIES = 10_000;

/** Default age cutoff for time-based activity cleanup: 90 days. */
export const ACTIVITY_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Note: the writer (`trackActivity`) lives in database.ts to avoid an
// import cycle with the Dexie hooks. This module owns the read API and
// the periodic prune.

// ─── Read API ────────────────────────────────────────────────

export interface ActivityQueryOptions {
	/** Restrict to a specific appId. */
	appId?: string;
	/** Restrict to a single record's history. */
	collection?: string;
	recordId?: string;
	/** Maximum number of entries to return (default: 50, max: 500). */
	limit?: number;
}

/**
 * Reads recent activity entries newest-first.
 *
 * Delegates to the `_events` Domain Event Store and converts to the
 * legacy ActivityEntry shape. The old `_activity` table is no longer
 * written to.
 */
export async function getRecentActivity(
	options: ActivityQueryOptions = {}
): Promise<ActivityEntry[]> {
	const limit = Math.min(options.limit ?? 50, 500);

	const events = await queryEvents({
		appId: options.appId,
		limit,
	});

	return events.map((e) => ({
		createdAt: e.meta.timestamp,
		appId: e.meta.appId,
		collection: e.meta.collection,
		recordId: e.meta.recordId,
		op: eventTypeToOp(e.type),
		userId: e.meta.userId,
	}));
}

function eventTypeToOp(type: string): ActivityOp {
	if (type.includes('Deleted') || type.includes('Undone')) return 'delete';
	if (
		type.includes('Created') ||
		type.includes('Logged') ||
		type.includes('Started') ||
		type.includes('Added')
	)
		return 'insert';
	return 'update';
}

// ─── Cleanup ─────────────────────────────────────────────────

/**
 * Removes activity entries older than the TTL and trims the table to
 * ACTIVITY_MAX_ENTRIES if it grew beyond the cap. Returns the number
 * of rows reclaimed. Safe to run periodically alongside the existing
 * tombstone cleanup.
 */
export async function pruneActivityLog(olderThanMs: number = ACTIVITY_TTL_MS): Promise<number> {
	const cutoff = new Date(Date.now() - olderThanMs).toISOString();
	let pruned = 0;

	// 1. TTL: drop everything older than the cutoff.
	const expiredKeys = await db
		.table<ActivityEntry>('_activity')
		.where('createdAt')
		.below(cutoff)
		.primaryKeys();
	if (expiredKeys.length > 0) {
		await db.table('_activity').bulkDelete(expiredKeys);
		pruned += expiredKeys.length;
	}

	// 2. Hard cap: if the log still exceeds the limit, drop the oldest
	//    rows by createdAt until we're back under the ceiling.
	const remaining = await db.table('_activity').count();
	if (remaining > ACTIVITY_MAX_ENTRIES) {
		const overflow = remaining - ACTIVITY_MAX_ENTRIES;
		const oldestKeys = await db
			.table<ActivityEntry>('_activity')
			.orderBy('createdAt')
			.limit(overflow)
			.primaryKeys();
		if (oldestKeys.length > 0) {
			await db.table('_activity').bulkDelete(oldestKeys);
			pruned += oldestKeys.length;
		}
	}

	return pruned;
}
