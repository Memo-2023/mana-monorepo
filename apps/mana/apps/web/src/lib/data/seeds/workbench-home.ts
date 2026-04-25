/**
 * Per-Space "Home" Workbench-Scene seeder.
 *
 * Registers a single seeder under the per-space-seeds registry. On
 * every active-Space switch, `setActiveSpace` invokes
 * `runSpaceSeeds(space.id)` which calls into here.
 *
 * Idempotency is structural: the row id is `seed-home-${spaceId}`
 * (deterministic) and the seeder no-ops if the row already exists.
 * Re-running for the same Space is a no-op — no duplicate possible
 * regardless of how the boot/replay timing shakes out. This is the
 * structural answer to the bug Schicht D-soft cleaned up after.
 *
 * The actual write is split out into `seedWorkbenchHomeOn(table, ...)`
 * so unit tests can drive it against a fixture Dexie instance without
 * pulling in `database.ts`'s side-effect imports.
 *
 * See docs/plans/workbench-seeding-cleanup.md §"Schicht B + C".
 */

import type { Table } from 'dexie';
import { db } from '../database';
import { registerSpaceSeed } from '../scope/per-space-seeds';
import type { LocalWorkbenchScene, WorkbenchSceneApp } from '$lib/types/workbench-scenes';

const TABLE = 'workbenchScenes';

/**
 * Default app list a fresh "Home" scene starts with. Three modules the
 * majority of users open on day one — keeps the workbench non-empty
 * without making decisions on the user's behalf. Exported so tests can
 * assert the seed shape.
 */
export const DEFAULT_HOME_APPS: WorkbenchSceneApp[] = [
	{ appId: 'todo' },
	{ appId: 'calendar' },
	{ appId: 'notes' },
];

/**
 * Deterministic id for a Space's seeded Home scene. Exported so
 * consumers can detect "this is the auto-seeded row" if they ever need
 * to.
 */
export function workbenchHomeSeedId(spaceId: string): string {
	return `seed-home-${spaceId}`;
}

/**
 * Pure-ish: takes a Dexie Table reference, ensures a Home scene exists
 * for the given Space. Returns true when a new row was inserted, false
 * when an existing Home is honoured. The creating-hook stamps the
 * actor / timestamps fields; this function only owns the
 * deterministic-id + default-shape contract.
 *
 * Two reasons we may skip the insert:
 *   1. The deterministic-id row already exists — the structural
 *      idempotency case. Re-running for the same Space is a no-op.
 *   2. A legacy random-uuid Home already exists for this Space — the
 *      transitional case for users coming from the pre-deterministic
 *      world (Schicht D-soft survivors). We defer to the user's
 *      existing layout. Schicht D-hard will rename such rows to the
 *      deterministic id and this branch becomes dead code.
 */
export async function seedWorkbenchHomeOn(
	table: Table<LocalWorkbenchScene, string>,
	spaceId: string
): Promise<boolean> {
	const id = workbenchHomeSeedId(spaceId);
	if (await table.get(id)) return false;

	// Transitional check: a Home scene already exists for this Space
	// under a different (legacy random) id. Skipping here avoids an
	// unnecessary create-then-soft-delete roundtrip via the dedup pass
	// in `+layout.svelte`, which would otherwise pick the customised
	// legacy row as the survivor and nuke our just-inserted seed.
	// Looks at the same "uncustomised default seed" shape the dedup
	// function uses, so a deliberately-named "Home" with description /
	// wallpaper / agent / scope still triggers a fresh seed.
	const legacy = await table
		.filter((r) => {
			if (r.deletedAt) return false;
			if (r.name !== 'Home') return false;
			if ((r as { spaceId?: unknown }).spaceId !== spaceId) return false;
			if (r.description) return false;
			if (r.wallpaper) return false;
			if (r.viewingAsAgentId) return false;
			if (r.scopeTagIds && r.scopeTagIds.length > 0) return false;
			return true;
		})
		.first();
	if (legacy) return false;

	const now = new Date().toISOString();
	const row: LocalWorkbenchScene & { spaceId: string } = {
		id,
		name: 'Home',
		openApps: DEFAULT_HOME_APPS,
		order: 0,
		createdAt: now,
		updatedAt: now,
		spaceId,
	};
	await table.add(row);
	return true;
}

registerSpaceSeed('workbench-home', async (spaceId) => {
	// `db.table('workbenchScenes')` returns `Table<any>`, which is
	// assignable to the seeder's `Table<LocalWorkbenchScene, string>`
	// signature. The explicit generic from earlier (`db.table<...>`)
	// resolved to `Table<…, IndexableType>` which TS rejects.
	await seedWorkbenchHomeOn(db.table(TABLE) as Table<LocalWorkbenchScene, string>, spaceId);
});
