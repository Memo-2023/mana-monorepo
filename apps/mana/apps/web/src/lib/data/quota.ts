/**
 * IndexedDB storage-quota handling.
 *
 * Browsers throw `QuotaExceededError` (DOMException) when an IndexedDB write
 * would push the origin over its allotted disk budget. Without explicit
 * handling, that error bubbles up out of a Dexie hook and the offending
 * write silently fails — the user types something, sees it appear in the
 * UI for a frame thanks to live queries, then it vanishes on next render.
 *
 * Strategy:
 *   1. `isQuotaError` recognises the DOMException across browsers (the name
 *      is standardised but a couple of legacy engines still use the code).
 *   2. `cleanupTombstones` reclaims space by hard-deleting `deletedAt`
 *      records older than a cutoff. Soft-deleted rows that the server has
 *      already acknowledged carry no value and are the cheapest thing to
 *      drop first.
 *   3. `notifyQuotaExceeded` dispatches a CustomEvent so the UI / error
 *      tracker can react (offer cleanup, log to Sentry, etc.).
 *
 * Used by both the Dexie creating-hook (last-resort retry on user input)
 * and the sync apply path (so server pulls don't crash a full DB).
 */

import { db, SYNC_APP_MAP } from './database';
import {
	isQuotaError,
	notifyQuotaExceeded,
	QUOTA_EVENT,
	type QuotaExceededDetail,
} from './quota-detect';

// Re-export so callers only need one import path.
export { isQuotaError, notifyQuotaExceeded, QUOTA_EVENT, type QuotaExceededDetail };

/** Default age cutoff for tombstone cleanup: 30 days. */
export const DEFAULT_TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hard-deletes soft-deleted (`deletedAt < cutoff`) records across every
 * sync-tracked table. Returns the total number of rows reclaimed.
 *
 * Does NOT touch tables outside SYNC_APP_MAP — bookkeeping tables like
 * _pendingChanges and _syncMeta have their own lifetimes.
 */
export async function cleanupTombstones(
	olderThanMs: number = DEFAULT_TOMBSTONE_TTL_MS
): Promise<number> {
	const cutoff = new Date(Date.now() - olderThanMs).toISOString();
	let cleaned = 0;

	for (const tables of Object.values(SYNC_APP_MAP)) {
		for (const tableName of tables) {
			const table = db.table(tableName);
			try {
				// Filter scan: deletedAt is not indexed on every table, so we
				// can't rely on .where(). The volume that this code path runs
				// against (only soft-deleted rows older than weeks) is small.
				const stale = await table
					.filter((r: unknown) => {
						const rec = r as { deletedAt?: string | null };
						return !!rec.deletedAt && rec.deletedAt < cutoff;
					})
					.primaryKeys();
				if (stale.length > 0) {
					await table.bulkDelete(stale);
					cleaned += stale.length;
				}
			} catch {
				// Best-effort. One bad table shouldn't abort the whole cleanup.
			}
		}
	}

	return cleaned;
}

/**
 * Runs `op`. If it throws QuotaExceededError, attempts a tombstone
 * cleanup and one retry; if cleanup recovered nothing or the retry still
 * fails, dispatches the quota event and re-throws. Used by the Dexie
 * creating-hook for user-initiated writes.
 */
export async function withQuotaRecovery<T>(
	op: () => Promise<T>,
	context: { table?: string; op?: QuotaExceededDetail['op'] } = {}
): Promise<T> {
	try {
		return await op();
	} catch (err) {
		if (!isQuotaError(err)) throw err;

		const cleaned = await cleanupTombstones();
		if (cleaned === 0) {
			notifyQuotaExceeded({ ...context, cleaned: 0, recovered: false });
			throw err;
		}

		try {
			const result = await op();
			notifyQuotaExceeded({ ...context, cleaned, recovered: true });
			return result;
		} catch (retryErr) {
			notifyQuotaExceeded({ ...context, cleaned, recovered: false });
			throw retryErr;
		}
	}
}
