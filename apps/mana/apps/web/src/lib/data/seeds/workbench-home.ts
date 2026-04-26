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
 * regardless of how the boot/replay timing shakes out.
 *
 * The actual write is split out into `seedWorkbenchHomeOn(table, ...)`
 * so unit tests can drive it against a fixture Dexie instance without
 * pulling in `database.ts`'s side-effect imports.
 *
 * See docs/plans/workbench-seeding-cleanup.md.
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
 * for the given Space. No-ops when the deterministic-id row is already
 * there. The creating-hook stamps actor + timestamps; this function
 * only owns the deterministic-id + default-shape contract.
 */
export async function seedWorkbenchHomeOn(
	table: Table<LocalWorkbenchScene, string>,
	spaceId: string
): Promise<void> {
	const id = workbenchHomeSeedId(spaceId);
	if (await table.get(id)) return;

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
}

registerSpaceSeed('workbench-home', async (spaceId) => {
	// `db.table('workbenchScenes')` returns `Table<any>`, which is
	// assignable to the seeder's `Table<LocalWorkbenchScene, string>`
	// signature. The explicit generic from earlier (`db.table<...>`)
	// resolved to `Table<…, IndexableType>` which TS rejects.
	await seedWorkbenchHomeOn(db.table(TABLE) as Table<LocalWorkbenchScene, string>, spaceId);
});
