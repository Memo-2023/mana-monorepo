/**
 * Local activity log — capped append-only feed of every write to a
 * sync-tracked table.
 *
 * Powers a future "What changed recently?" UI and a per-record history
 * view without ever shipping these entries to the backend (the table is
 * deliberately NOT in SYNC_APP_MAP). Each row is intentionally tiny — no
 * field diffs, no payloads — so the disk footprint stays bounded even on
 * power-user accounts.
 *
 * Population is automatic: the Dexie creating/updating hooks in
 * `database.ts` call `recordActivity()` after every successful write.
 * Soft deletes (`deletedAt` set on an update) are recorded as `op:
 * 'delete'`. Server-applied changes (apply lock active for the table) are
 * skipped so the feed reflects local user intent, not sync echo.
 */

import { db } from './database';
import { getEffectiveUserId } from './current-user';

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
 * Reads recent activity entries newest-first. The reverse-order walk
 * over the indexed `createdAt` BTree short-circuits as soon as the
 * limit is reached, so the cost is bounded by `limit` rather than the
 * total log size.
 */
export async function getRecentActivity(
	options: ActivityQueryOptions = {}
): Promise<ActivityEntry[]> {
	const limit = Math.min(options.limit ?? 50, 500);
	const userId = getEffectiveUserId();

	// Single-record history takes the most-specific compound index.
	if (options.collection && options.recordId) {
		return db
			.table<ActivityEntry>('_activity')
			.where('[collection+recordId]')
			.equals([options.collection, options.recordId])
			.reverse()
			.limit(limit)
			.toArray();
	}

	// Per-app feed uses the [appId+createdAt] compound index.
	if (options.appId) {
		const collection = db
			.table<ActivityEntry>('_activity')
			.where('[appId+createdAt]')
			.between([options.appId, ''], [options.appId, '\uffff'])
			.reverse();
		return collection
			.filter((a) => a.userId === userId)
			.limit(limit)
			.toArray();
	}

	// Global feed: walk createdAt BTree backwards, filter to current user.
	return db
		.table<ActivityEntry>('_activity')
		.orderBy('createdAt')
		.reverse()
		.filter((a) => a.userId === userId)
		.limit(limit)
		.toArray();
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
