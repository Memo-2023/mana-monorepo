/**
 * Tombstone queue for orphaned mana-events snapshots.
 *
 * When the client fails to DELETE a published snapshot from the server
 * (network error, server down, etc.), the local event is still removed
 * but the server keeps a stale copy. We push the (eventId, token) here
 * so a later drain pass can retry the delete.
 */

import { db } from '$lib/data/database';
import { eventsApi } from './api';

interface Tombstone {
	id: string;
	token: string;
	eventId: string;
	attempts: number;
	createdAt: string;
}

const MAX_ATTEMPTS = 10;

export async function recordTombstone(eventId: string, token: string): Promise<void> {
	try {
		await db.table<Tombstone>('_eventsTombstones').put({
			id: token, // token is unique per snapshot
			token,
			eventId,
			attempts: 0,
			createdAt: new Date().toISOString(),
		});
	} catch (e) {
		console.warn('Failed to record events tombstone:', e);
	}
}

let draining = false;

/**
 * Try to delete every queued snapshot. Idempotent — safe to call repeatedly.
 * Tombstones are removed on success or after MAX_ATTEMPTS gives up.
 * Skips work if a drain is already in progress.
 */
export async function drainTombstones(): Promise<{ deleted: number; failed: number }> {
	if (draining) return { deleted: 0, failed: 0 };
	draining = true;
	let deleted = 0;
	let failed = 0;
	try {
		const all = await db.table<Tombstone>('_eventsTombstones').toArray();
		for (const t of all) {
			try {
				await eventsApi.unpublish(t.eventId);
				await db.table('_eventsTombstones').delete(t.id);
				deleted++;
			} catch {
				const next = t.attempts + 1;
				if (next >= MAX_ATTEMPTS) {
					console.warn(`Giving up on events tombstone ${t.token} after ${MAX_ATTEMPTS} attempts`);
					await db.table('_eventsTombstones').delete(t.id);
				} else {
					await db.table('_eventsTombstones').update(t.id, { attempts: next });
				}
				failed++;
			}
		}
	} finally {
		draining = false;
	}
	return { deleted, failed };
}
