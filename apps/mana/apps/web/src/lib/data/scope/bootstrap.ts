/**
 * Sentinel reconciliation — rewrites `_personal:<userId>` placeholders
 * left by the Dexie v28 upgrade with the user's real personal-space id.
 *
 * Runs once per login after the active space has loaded. Idempotent —
 * re-running after all sentinels are rewritten is a no-op.
 *
 * See docs/plans/spaces-foundation.md §5.3 ("Sentinel reconciliation").
 */

import { db } from '../database';
import { SYNC_APP_MAP } from '../module-registry';
import { getCurrentUserId } from '../current-user';
import { getActiveSpace } from './active-space.svelte';

/**
 * Rewrite every record whose spaceId is `_personal:<currentUserId>` to the
 * real personal-space id. Returns the total number of records rewritten.
 *
 * Safe to call before `loadActiveSpace()` has resolved — it'll no-op and
 * return 0. The caller is expected to retry after the active space is
 * ready (typically chained: `loadActiveSpace().then(reconcileSentinels)`).
 */
export async function reconcileSentinels(): Promise<number> {
	const userId = getCurrentUserId();
	if (!userId) return 0;
	const space = getActiveSpace();
	if (!space || space.type !== 'personal') {
		// Only the personal space owns sentinel records — other spaces were
		// created after v28 shipped, so their records already have the
		// correct spaceId from the Dexie creating-hook.
		return 0;
	}

	const sentinel = `_personal:${userId}`;
	if (sentinel === space.id) return 0; // already reconciled or pathological

	const appTableNames = new Set<string>();
	for (const tables of Object.values(SYNC_APP_MAP)) {
		for (const t of tables) appTableNames.add(t);
	}

	let rewritten = 0;
	for (const name of appTableNames) {
		// Use a transaction per table so one slow table doesn't block the rest
		// if something aborts — partial reconciliation is recoverable on next
		// boot because the filter is idempotent.
		const table = db.table(name);
		const count = await table
			.filter((record: unknown) => {
				const r = record as { spaceId?: unknown };
				return r.spaceId === sentinel;
			})
			.modify({ spaceId: space.id });
		rewritten += count;
	}
	return rewritten;
}

/**
 * Sentinel value a record has before it's been reconciled, for the given
 * user. Exposed for tests and for the creating hook that needs to match
 * against it when reading back fresh writes.
 */
export function personalSpaceSentinel(userId: string): string {
	return `_personal:${userId}`;
}
