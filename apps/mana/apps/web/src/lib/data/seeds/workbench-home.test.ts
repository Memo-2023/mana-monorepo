/**
 * Unit tests for the workbench-home seeder. Exercises the pure
 * `seedWorkbenchHomeOn(table, spaceId)` against an isolated Dexie db
 * so the test never has to mount the full `database.ts` module.
 *
 * The module under test side-effect-imports `db` from `../database`
 * and calls `registerSpaceSeed` at top level — both stubbed so the
 * import doesn't fail during test bootstrap.
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dexie, { type Table } from 'dexie';
import type { LocalWorkbenchScene } from '$lib/types/workbench-scenes';

// Stub `../database` so importing the seeder doesn't try to bring in
// the real Dexie singleton (which transitively imports auth stores,
// triggers, funnel-tracking, …). The seeder uses `db` only inside the
// registered closure; the pure function under test takes its table
// argument directly.
vi.mock('../database', () => ({
	db: {
		table: () => ({
			get: vi.fn(),
			add: vi.fn(),
		}),
	},
}));

import { seedWorkbenchHomeOn, workbenchHomeSeedId, DEFAULT_HOME_APPS } from './workbench-home';

interface FixtureDb extends Dexie {
	workbenchScenes: Table<LocalWorkbenchScene, string>;
}

let db: FixtureDb;

function makeDb(): FixtureDb {
	const fresh = new Dexie(`seeder-test-${crypto.randomUUID()}`) as FixtureDb;
	fresh.version(1).stores({ workbenchScenes: 'id, order' });
	return fresh;
}

beforeEach(async () => {
	db = makeDb();
	await db.open();
});

afterEach(async () => {
	db.close();
	await Dexie.delete(db.name);
});

describe('workbenchHomeSeedId', () => {
	it('produces a deterministic id keyed by spaceId', () => {
		expect(workbenchHomeSeedId('space-abc')).toBe('seed-home-space-abc');
		expect(workbenchHomeSeedId('space-abc')).toBe(workbenchHomeSeedId('space-abc'));
		expect(workbenchHomeSeedId('space-abc')).not.toBe(workbenchHomeSeedId('space-xyz'));
	});
});

describe('seedWorkbenchHomeOn', () => {
	it('inserts a Home scene with the deterministic id and default apps', async () => {
		const inserted = await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		expect(inserted).toBe(true);

		const row = await db.workbenchScenes.get('seed-home-space-abc');
		expect(row).toMatchObject({
			id: 'seed-home-space-abc',
			name: 'Home',
			order: 0,
			openApps: DEFAULT_HOME_APPS,
			spaceId: 'space-abc',
		});
		expect(row?.createdAt).toBeTruthy();
		expect(row?.updatedAt).toBeTruthy();
	});

	it('is a no-op when the seeded row already exists', async () => {
		await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		const second = await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		expect(second).toBe(false);

		const all = await db.workbenchScenes.toArray();
		expect(all).toHaveLength(1);
	});

	it('does not overwrite a customized survivor', async () => {
		// Simulate the user having added apps to their Home scene.
		await db.workbenchScenes.add({
			id: 'seed-home-space-abc',
			name: 'Home',
			order: 0,
			openApps: [{ appId: 'todo' }, { appId: 'mood' }, { appId: 'meditate' }],
			createdAt: '2026-04-25T08:00:00.000Z',
			updatedAt: '2026-04-25T11:00:00.000Z',
		} as LocalWorkbenchScene);

		await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');

		const row = await db.workbenchScenes.get('seed-home-space-abc');
		// The user's openApps survive — seeder respects existing state.
		expect(row?.openApps).toEqual([{ appId: 'todo' }, { appId: 'mood' }, { appId: 'meditate' }]);
	});

	it('defers to a legacy random-uuid Home in the same Space (transitional)', async () => {
		// Simulates a user coming from the pre-deterministic-id world —
		// e.g. a Schicht D-soft dedup survivor with a random UUID and
		// the default openApps shape. The new seeder must NOT create a
		// second deterministic-id row alongside it, otherwise +layout's
		// dedup pass would just churn through soft-deleting one of them.
		await db.workbenchScenes.add({
			id: 'legacy-random-uuid-1234',
			name: 'Home',
			order: 0,
			openApps: [{ appId: 'todo' }, { appId: 'calendar' }, { appId: 'notes' }],
			createdAt: '2026-04-23T08:00:00.000Z',
			updatedAt: '2026-04-23T08:00:00.000Z',
			spaceId: 'space-abc',
		} as LocalWorkbenchScene & { spaceId: string });

		const inserted = await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		expect(inserted).toBe(false);

		const all = await db.workbenchScenes.toArray();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe('legacy-random-uuid-1234');
	});

	it('still seeds when the existing Home is in a different Space', async () => {
		await db.workbenchScenes.add({
			id: 'legacy-random-uuid-other-space',
			name: 'Home',
			order: 0,
			openApps: DEFAULT_HOME_APPS,
			createdAt: '2026-04-23T08:00:00.000Z',
			updatedAt: '2026-04-23T08:00:00.000Z',
			spaceId: 'space-different',
		} as LocalWorkbenchScene & { spaceId: string });

		const inserted = await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		expect(inserted).toBe(true);

		const seeded = await db.workbenchScenes.get('seed-home-space-abc');
		expect(seeded).toBeDefined();
	});

	it('still seeds when the existing Home in this Space is customised', async () => {
		// A user-customised "Home" (renamed-back, with a description or
		// wallpaper) shouldn't block fresh seeds — the dedup heuristic
		// already excludes such rows from merging, so the symmetric
		// behaviour here is to seed anyway. Schicht D-hard will normalise.
		await db.workbenchScenes.add({
			id: 'user-custom-home',
			name: 'Home',
			description: 'My personal layout',
			order: 0,
			openApps: [{ appId: 'todo' }],
			createdAt: '2026-04-23T08:00:00.000Z',
			updatedAt: '2026-04-23T08:00:00.000Z',
			spaceId: 'space-abc',
		} as LocalWorkbenchScene & { spaceId: string });

		const inserted = await seedWorkbenchHomeOn(db.workbenchScenes, 'space-abc');
		expect(inserted).toBe(true);
	});

	it('seeds independently per Space (no cross-pollination)', async () => {
		await seedWorkbenchHomeOn(db.workbenchScenes, 'space-A');
		await seedWorkbenchHomeOn(db.workbenchScenes, 'space-B');

		const all = await db.workbenchScenes.toArray();
		expect(all.map((r) => r.id).sort()).toEqual(['seed-home-space-A', 'seed-home-space-B']);
	});

	it('survives concurrent calls for the same Space without producing duplicates', async () => {
		// The structural promise: deterministic id + Dexie `add` on a
		// PK-uniqueness violation will throw, but the get-then-add
		// guard should short-circuit. Either way: no two rows.
		await Promise.allSettled([
			seedWorkbenchHomeOn(db.workbenchScenes, 'space-race'),
			seedWorkbenchHomeOn(db.workbenchScenes, 'space-race'),
			seedWorkbenchHomeOn(db.workbenchScenes, 'space-race'),
		]);

		const all = await db.workbenchScenes.where('id').equals('seed-home-space-race').toArray();
		expect(all).toHaveLength(1);
	});
});
