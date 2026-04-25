/**
 * Dexie bridge for the scope-change signal.
 *
 * Problem this solves: `getInScopeSpaceIds()` reads from plain Svelte
 * `$state` (`active-space.svelte.ts#active` + `current-user.ts#currentUserId`).
 * Dexie's `liveQuery` only re-runs when a Dexie table it read changes;
 * a `$state` assignment is invisible to it. The bootstrap sequence —
 * user opens `/wardrobe`, first querier runs before the active-space
 * is resolved from Better Auth, returns empty, setActiveSpace fires,
 * but the liveQuery never re-evaluates — left modules stuck on an
 * empty first result until an unrelated write woke them up.
 *
 * This module is the Dexie proxy. A single-row `_scopeCursor` table
 * (schema: `_scopeCursor: 'id'`, registered in Dexie v45) acts as the
 * change beacon. `bumpScopeCursor()` writes a new `{id:'active',
 * bumpedAt}` row every time scope state changes; `touchScopeCursor()`
 * reads the row on every scoped query so liveQuery subscribes to the
 * table. Net effect: a scope change triggers one infra write, every
 * dependent query re-runs with the fresh `getInScopeSpaceIds()`.
 *
 * Kept intentionally minimal (no encryption, no pending-change
 * tracking, not in SYNC_APP_MAP) — it's a liveness signal, not user
 * data.
 */

import { db } from '../database';

const SCOPE_CURSOR_ID = 'active';

/**
 * Write a new `_scopeCursor` row so any in-flight liveQuery that
 * touched the table re-runs its querier. Swallows Dexie errors —
 * this is a best-effort signal, a missing bump only delays the
 * re-evaluation until the next Dexie write to a tracked table.
 * Safe to call before Dexie finishes opening; the write queues.
 */
export function bumpScopeCursor(): void {
	void db
		.table('_scopeCursor')
		.put({ id: SCOPE_CURSOR_ID, bumpedAt: Date.now() })
		.catch((err) => {
			console.warn('[scope/cursor] bump failed', err);
		});
}

/**
 * Register a liveQuery-time subscription on `_scopeCursor`.
 * Fire-and-forget: the Dexie read registers the subscription
 * synchronously during the querier's execution, even though the
 * returned Promise is not awaited. The async resolution itself is
 * irrelevant — liveQuery only cares that the table was read.
 *
 * Called from `scopedTable` / `scopedGet` so every scoped query
 * automatically subscribes without the caller needing to know.
 */
export function touchScopeCursor(): void {
	void db
		.table('_scopeCursor')
		.get(SCOPE_CURSOR_ID)
		.catch(() => undefined);
}
