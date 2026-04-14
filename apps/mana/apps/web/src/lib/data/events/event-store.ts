/**
 * Event Store — Persists all domain events to the _events Dexie table.
 *
 * Subscribes to eventBus.onAny() and writes each event as an append-only
 * row. Provides query helpers for Projections and the Correlation Engine.
 *
 * Retention: 90 days / 50,000 events max (whichever is reached first).
 */

import { db } from '../database';
import { eventBus } from './event-bus';
import type { DomainEvent } from './types';

const EVENTS_TABLE = '_events';
const MAX_EVENTS = 50_000;
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

let unsubscribe: (() => void) | null = null;

/** Start persisting all domain events. Call once at app init. */
export function startEventStore(): void {
	if (unsubscribe) return;
	unsubscribe = eventBus.onAny((event: DomainEvent) => {
		db.table(EVENTS_TABLE)
			.add({
				type: event.type,
				payload: event.payload,
				meta: event.meta,
			})
			.catch((err: unknown) => {
				console.error('[event-store] failed to persist event:', err);
			});
	});
}

/** Stop persisting events (for cleanup / tests). */
export function stopEventStore(): void {
	unsubscribe?.();
	unsubscribe = null;
}

// ── Queries ─────────────────────────────────────────

export interface EventQuery {
	appId?: string;
	type?: string;
	since?: string; // ISO timestamp
	until?: string; // ISO timestamp
	limit?: number; // default 100
}

interface StoredEvent {
	seq?: number;
	type: string;
	payload: unknown;
	meta: DomainEvent['meta'];
}

/** Query persisted events. Most recent first. */
export async function queryEvents(query: EventQuery = {}): Promise<DomainEvent[]> {
	const limit = Math.min(query.limit ?? 100, 1000);
	let collection;

	if (query.appId && query.type) {
		// Use compound index for appId, filter type in JS
		collection = db
			.table(EVENTS_TABLE)
			.where('[meta.appId+meta.timestamp]')
			.between([query.appId, query.since ?? ''], [query.appId, query.until ?? '\uffff']);
	} else if (query.appId) {
		collection = db
			.table(EVENTS_TABLE)
			.where('[meta.appId+meta.timestamp]')
			.between([query.appId, query.since ?? ''], [query.appId, query.until ?? '\uffff']);
	} else if (query.type) {
		collection = db
			.table(EVENTS_TABLE)
			.where('[type+meta.timestamp]')
			.between([query.type, query.since ?? ''], [query.type, query.until ?? '\uffff']);
	} else {
		collection = db.table(EVENTS_TABLE).orderBy('seq');
	}

	let results: StoredEvent[] = await collection.reverse().limit(limit).toArray();

	// Apply additional filters not covered by the index
	if (query.type && query.appId) {
		results = results.filter((e) => e.type === query.type);
	}
	if (query.since && !query.appId && !query.type) {
		results = results.filter((e) => e.meta.timestamp >= query.since!);
	}
	if (query.until && !query.appId && !query.type) {
		results = results.filter((e) => e.meta.timestamp <= query.until!);
	}

	return results.map((row) => ({
		type: row.type,
		payload: row.payload,
		meta: row.meta,
	}));
}

/** Count events by type within a date range. */
export async function countEventsByType(
	since: string,
	until: string
): Promise<Record<string, number>> {
	const rows: StoredEvent[] = await db
		.table(EVENTS_TABLE)
		.where('meta.timestamp')
		.between(since, until)
		.toArray();

	const counts: Record<string, number> = {};
	for (const row of rows) {
		counts[row.type] = (counts[row.type] ?? 0) + 1;
	}
	return counts;
}

// ── Pruning ─────────────────────────────────────────

/** Remove events older than TTL or exceeding max count. */
export async function pruneEventStore(): Promise<number> {
	const cutoff = new Date(Date.now() - TTL_MS).toISOString();
	let deleted = 0;

	// Delete by age
	const old = await db.table(EVENTS_TABLE).where('meta.timestamp').below(cutoff).primaryKeys();
	if (old.length > 0) {
		await db.table(EVENTS_TABLE).bulkDelete(old);
		deleted += old.length;
	}

	// Delete overflow (keep newest MAX_EVENTS)
	const total = await db.table(EVENTS_TABLE).count();
	if (total > MAX_EVENTS) {
		const overflow = total - MAX_EVENTS;
		const oldest = await db.table(EVENTS_TABLE).orderBy('seq').limit(overflow).primaryKeys();
		if (oldest.length > 0) {
			await db.table(EVENTS_TABLE).bulkDelete(oldest);
			deleted += oldest.length;
		}
	}

	return deleted;
}
