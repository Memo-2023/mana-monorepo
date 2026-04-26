/**
 * Conflict Store — surfaces sync field-LWW overwrites to the user.
 *
 * Subscribes to the `mana-sync-conflict` CustomEvent that
 * `applyServerChanges` fires whenever it overwrites a non-empty local
 * field with a strictly-newer server value. Each event becomes a row
 * in the visible-conflicts list, which a toast component renders so
 * the user can either:
 *
 *   - Restore (writes the original local value back with a fresh
 *     updatedAt that beats the server's, queues a sync push)
 *   - Dismiss (just removes the toast — server value stays)
 *
 * Coalescing
 * ----------
 * Multiple conflicts on the same record collapse into ONE entry, with
 * a per-field map underneath. A burst of 5 server changes hitting the
 * same task only shows one toast (not five), and Restore reverts ALL
 * affected fields in one transaction. The coalesce key is
 * `${tableName}|${recordId}` and the dedup window is the time the
 * record stays in `visible`.
 *
 * Auto-dismiss
 * ------------
 * Each conflict expires after CONFLICT_TTL_MS (default 30s) so a long-
 * running session doesn't accumulate stale toasts. Manual dismiss
 * trumps the timer.
 *
 * Restore semantics
 * -----------------
 * Restoration runs OUTSIDE the apply lock — applyServerChanges holds
 * a per-table lock that suppresses pending-change tracking, and we
 * want our restore write to be tracked. We defer via setTimeout(0)
 * which lands after the current microtask drain, by which time the
 * apply lock has been released in the finally block.
 */

import { db } from './database';
import { subscribeSyncConflicts, type SyncConflictPayload } from './sync';

/** How long a conflict stays visible before auto-dismissing. */
const CONFLICT_TTL_MS = 30_000;

/** Cap on the visible list — older entries get evicted FIFO so a
 *  bursty server can't grow the array unbounded. */
const MAX_VISIBLE = 8;

/** A coalesced conflict — one per (tableName, recordId), with the
 *  per-field overwrite details merged. */
export interface SyncConflict {
	/** Stable id for the toast key — `${tableName}|${recordId}`. */
	id: string;
	tableName: string;
	recordId: string;
	/** Per-field overwrite details. New fields from later events get
	 *  merged in; if the same field fires twice, the latest server
	 *  state wins (we don't try to be smarter — restore would still
	 *  bring back the original local value from the first event). */
	fields: Record<
		string,
		{
			wasLocal: unknown;
			nowServer: unknown;
			localTime: string;
			serverTime: string;
		}
	>;
	detectedAt: string; // ISO
}

let visible = $state<SyncConflict[]>([]);
let timers = new Map<string, ReturnType<typeof setTimeout>>();
let installed = false;

function scheduleAutoDismiss(id: string): void {
	const existing = timers.get(id);
	if (existing) clearTimeout(existing);
	const t = setTimeout(() => dismiss(id), CONFLICT_TTL_MS);
	timers.set(id, t);
}

function clearTimer(id: string): void {
	const t = timers.get(id);
	if (t) {
		clearTimeout(t);
		timers.delete(id);
	}
}

function ingest(payload: SyncConflictPayload): void {
	const id = `${payload.tableName}|${payload.recordId}`;
	const now = new Date().toISOString();

	const existing = visible.find((c) => c.id === id);
	if (existing) {
		// Coalesce a new field-overwrite into the existing entry.
		// Don't clobber the original wasLocal — that's the value the
		// user actually typed. Only update nowServer + serverTime.
		const prior = existing.fields[payload.field];
		existing.fields[payload.field] = {
			wasLocal: prior ? prior.wasLocal : payload.wasLocal,
			nowServer: payload.nowServer,
			localTime: prior ? prior.localTime : payload.localTime,
			serverTime: payload.serverTime,
		};
		// Touch the timer so the toast stays visible while bursts arrive.
		scheduleAutoDismiss(id);
		// Force reactivity — Svelte 5 needs a new array reference for
		// $derived consumers to re-render. Mutating in place leaves
		// $effect blind.
		visible = [...visible];
		return;
	}

	const fresh: SyncConflict = {
		id,
		tableName: payload.tableName,
		recordId: payload.recordId,
		fields: {
			[payload.field]: {
				wasLocal: payload.wasLocal,
				nowServer: payload.nowServer,
				localTime: payload.localTime,
				serverTime: payload.serverTime,
			},
		},
		detectedAt: now,
	};

	// FIFO eviction if we're at the cap.
	const next = [...visible, fresh];
	if (next.length > MAX_VISIBLE) {
		const evicted = next.shift();
		if (evicted) clearTimer(evicted.id);
	}
	visible = next;
	scheduleAutoDismiss(id);
}

function dismiss(id: string): void {
	clearTimer(id);
	visible = visible.filter((c) => c.id !== id);
}

async function restore(id: string): Promise<void> {
	const conflict = visible.find((c) => c.id === id);
	if (!conflict) return;

	// Defer the actual write so we land after applyServerChanges has
	// released its apply-lock for this table. setTimeout(0) is enough
	// — the lock is released synchronously in the finally block, and
	// the next macrotask runs after that.
	await new Promise<void>((resolve) => setTimeout(resolve, 0));

	const now = new Date().toISOString();
	const updates: Record<string, unknown> = {};

	for (const [field, info] of Object.entries(conflict.fields)) {
		updates[field] = info.wasLocal;
	}

	// The Dexie updating-hook re-stamps `__fieldMeta` for every modified
	// field with origin='user' and `at: now`, which is exactly what we
	// want here: the restore is a fresh user edit that should win LWW
	// against the server's overwrite on the next sync round. No manual
	// __fieldMeta patching needed.
	try {
		await db.table(conflict.tableName).update(conflict.recordId, updates);
	} catch (err) {
		console.error(
			`[mana-conflict] restore failed for ${conflict.tableName}/${conflict.recordId}:`,
			err
		);
		// Leave the toast in place so the user knows the restore didn't
		// land — they can retry or dismiss manually.
		return;
	}

	dismiss(id);
}

/** Boot-time installer. Wires a single sync-conflict subscriber via
 *  the in-module pub/sub helper from sync.ts. The data-layer-listeners
 *  module calls this in the same place that installs the quota +
 *  telemetry listeners, so it's symmetrical with every other sync-side
 *  observer. */
export function installConflictListener(): () => void {
	if (installed) return () => {};
	installed = true;

	const unsubscribe = subscribeSyncConflicts((payload) => {
		ingest(payload);
	});

	return () => {
		unsubscribe();
		for (const t of timers.values()) clearTimeout(t);
		timers.clear();
		visible = [];
		installed = false;
	};
}

/** Read-only view of the visible conflicts for the toast component. */
export const conflictStore = {
	get visible() {
		return visible;
	},
	dismiss,
	restore,
	/** Test-only: clear everything without going through the listener. */
	_resetForTesting() {
		for (const t of timers.values()) clearTimeout(t);
		timers.clear();
		visible = [];
		installed = false;
	},
};
