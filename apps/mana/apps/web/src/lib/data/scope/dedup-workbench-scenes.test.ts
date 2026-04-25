/**
 * Unit tests for `dedupHomeScenesOn` — the soft-cleanup pass that
 * collapses duplicate "Home" scenes accumulated by the seeding race
 * (see docs/plans/workbench-seeding-cleanup.md).
 *
 * Uses an isolated Dexie db with just a `workbenchScenes` table so the
 * test doesn't drag in `database.ts`'s side-effect imports (auth store,
 * triggers, funnel tracking, …) — the function under test only needs a
 * Table reference, so a one-table fixture is enough.
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Dexie, { type Table } from 'dexie';
import type { LocalWorkbenchScene } from '$lib/types/workbench-scenes';
import { dedupHomeScenesOn } from './dedup-workbench-scenes';

// Public LocalWorkbenchScene doesn't carry the runtime-stamped scope
// fields (spaceId/authorId/visibility) — they're added by the creating
// hook. Tests need to set spaceId explicitly to drive grouping, so we
// model the row as the public shape plus an optional spaceId override.
type SceneRow = LocalWorkbenchScene & { spaceId?: string };

interface FixtureDb extends Dexie {
	workbenchScenes: Table<SceneRow, string>;
}

let db: FixtureDb;

function makeDb(): FixtureDb {
	const fresh = new Dexie(`dedup-test-${crypto.randomUUID()}`) as FixtureDb;
	fresh.version(1).stores({ workbenchScenes: 'id, order' });
	return fresh;
}

function makeScene(overrides: Partial<SceneRow>): SceneRow {
	return {
		id: 'scene-default',
		name: 'Home',
		openApps: [{ appId: 'todo' }, { appId: 'calendar' }, { appId: 'notes' }],
		order: 0,
		createdAt: '2026-04-25T10:00:00.000Z',
		updatedAt: '2026-04-25T10:00:00.000Z',
		spaceId: 'space-personal',
		...overrides,
	};
}

beforeEach(async () => {
	db = makeDb();
	await db.open();
});

afterEach(async () => {
	db.close();
	await Dexie.delete(db.name);
});

describe('dedupHomeScenesOn', () => {
	it('returns 0 and changes nothing when there are no duplicates', async () => {
		await db.workbenchScenes.add(makeScene({ id: 's1' }));
		await db.workbenchScenes.add(makeScene({ id: 's2', spaceId: 'space-other' }));

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		expect(removed).toBe(0);
		const remaining = await db.workbenchScenes
			.toArray()
			.then((rows) => rows.filter((r) => !r.deletedAt));
		expect(remaining).toHaveLength(2);
	});

	it('keeps one survivor per (spaceId) group and soft-deletes the rest', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 's1', updatedAt: '2026-04-25T09:00:00.000Z' }),
			makeScene({ id: 's2', updatedAt: '2026-04-25T10:00:00.000Z' }),
			makeScene({ id: 's3', updatedAt: '2026-04-25T11:00:00.000Z' }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		expect(removed).toBe(2);
		const all = await db.workbenchScenes.toArray();
		const alive = all.filter((r) => !r.deletedAt);
		const dead = all.filter((r) => r.deletedAt);
		expect(alive).toHaveLength(1);
		expect(dead).toHaveLength(2);
	});

	it('picks the survivor with the most openApps, then most recent updatedAt', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({
				id: 'older-richer',
				openApps: [{ appId: 'todo' }, { appId: 'calendar' }, { appId: 'notes' }],
				updatedAt: '2026-04-25T09:00:00.000Z',
			}),
			makeScene({
				id: 'newer-leaner',
				openApps: [{ appId: 'todo' }],
				updatedAt: '2026-04-25T11:00:00.000Z',
			}),
		]);

		await dedupHomeScenesOn(db.workbenchScenes);

		const alive = await db.workbenchScenes
			.toArray()
			.then((rows) => rows.filter((r) => !r.deletedAt));
		expect(alive.map((r) => r.id)).toEqual(['older-richer']);
	});

	it('merges openApps from losers into the survivor (dedup by appId)', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({
				id: 'survivor',
				openApps: [{ appId: 'todo' }, { appId: 'calendar' }, { appId: 'notes' }],
			}),
			makeScene({
				id: 'loser-extra',
				openApps: [{ appId: 'notes' }, { appId: 'mood' }],
			}),
		]);

		await dedupHomeScenesOn(db.workbenchScenes);

		const survivor = await db.workbenchScenes.get('survivor');
		expect(survivor?.openApps?.map((a) => a.appId).sort()).toEqual([
			'calendar',
			'mood',
			'notes',
			'todo',
		]);
	});

	it('keeps groups separate by spaceId — no cross-space merging', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 'a1', spaceId: 'space-A' }),
			makeScene({ id: 'a2', spaceId: 'space-A' }),
			makeScene({ id: 'b1', spaceId: 'space-B' }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		expect(removed).toBe(1);
		const alive = await db.workbenchScenes
			.toArray()
			.then((rows) => rows.filter((r) => !r.deletedAt));
		expect(alive).toHaveLength(2);
		expect(alive.map((r) => r.spaceId).sort()).toEqual(['space-A', 'space-B']);
	});

	it('leaves user-customized scenes alone (description / wallpaper / agent / scope)', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 's1' }),
			makeScene({ id: 's2', description: 'Mein Workspace' }),
			makeScene({ id: 's3', viewingAsAgentId: 'agent-1' }),
			makeScene({ id: 's4', scopeTagIds: ['tag-1'] }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		// s1 is the only mergeable row in its group of 1 → no removal.
		expect(removed).toBe(0);
		const alive = await db.workbenchScenes
			.toArray()
			.then((rows) => rows.filter((r) => !r.deletedAt));
		expect(alive).toHaveLength(4);
	});

	it('leaves non-Home scenes alone even when duplicated by name', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 'd1', name: 'Deep Work' }),
			makeScene({ id: 'd2', name: 'Deep Work' }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		expect(removed).toBe(0);
	});

	it('skips already-tombstoned rows', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 's1' }),
			makeScene({ id: 's2', deletedAt: '2026-04-24T10:00:00.000Z' }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		// Only one live row in the group → no removal.
		expect(removed).toBe(0);
		const stillDeleted = await db.workbenchScenes.get('s2');
		expect(stillDeleted?.deletedAt).toBe('2026-04-24T10:00:00.000Z');
	});

	it('is idempotent — running twice produces the same end state', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 's1' }),
			makeScene({ id: 's2' }),
			makeScene({ id: 's3' }),
		]);

		const firstRemoved = await dedupHomeScenesOn(db.workbenchScenes);
		const secondRemoved = await dedupHomeScenesOn(db.workbenchScenes);

		expect(firstRemoved).toBe(2);
		expect(secondRemoved).toBe(0);
	});

	it('skips rows without a string spaceId (ambiguous group key)', async () => {
		await db.workbenchScenes.bulkAdd([
			makeScene({ id: 's1', spaceId: undefined }),
			makeScene({ id: 's2', spaceId: undefined }),
		]);

		const removed = await dedupHomeScenesOn(db.workbenchScenes);

		expect(removed).toBe(0);
	});
});
