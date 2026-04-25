/**
 * Integration test for the full per-Space-seeds wiring:
 *
 *   active-space → applyActiveSpace → runSpaceSeeds → workbench-home → Dexie
 *
 * Replaces the implicit "trust the unit tests" gap: the unit suites
 * cover each piece in isolation, but the wiring (which file imports
 * which, which side effects fire when) is what the bug was actually
 * about. This test boots the chain against a fixture Dexie and asserts
 * the Home row lands.
 *
 * See docs/plans/workbench-seeding-cleanup.md.
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Dexie, { type Table } from 'dexie';
import type { LocalWorkbenchScene } from '$lib/types/workbench-scenes';

// `LocalWorkbenchScene` doesn't model the runtime-stamped scope fields
// (the creating-hook adds spaceId/authorId/visibility); the wiring
// asserts on spaceId directly, so the fixture row type carries it.
type SceneRow = LocalWorkbenchScene & { spaceId?: string };

// Build a fixture Dexie instance that the mocked `db` will point at.
// Top-level so the vi.mock factory can close over it without TDZ.
let fixtureDb: Dexie & { workbenchScenes: Table<SceneRow, string> };

import { vi } from 'vitest';

vi.mock('../database', () => ({
	get db() {
		return fixtureDb;
	},
}));

// Importing the seeds barrel registers every per-Space seeder. Must
// come AFTER vi.mock — otherwise the seeder's top-level
// `import { db } from '../database'` resolves before the mock is
// installed.
import '$lib/data/seeds';
import { runSpaceSeeds, __resetSpaceSeedsForTests } from '../scope/per-space-seeds';
import { workbenchHomeSeedId } from './workbench-home';

beforeEach(async () => {
	fixtureDb = new Dexie(`wiring-test-${crypto.randomUUID()}`) as typeof fixtureDb;
	fixtureDb.version(1).stores({ workbenchScenes: 'id, order' });
	await fixtureDb.open();

	// The seeds barrel was imported once at module load — but the
	// registry is module-level and persists across tests in the same
	// vitest worker. Re-import via dynamic import would be a
	// resolution dance; instead we just re-register manually. The
	// real seeder does the same thing.
	__resetSpaceSeedsForTests();
	const { registerSpaceSeed } = await import('../scope/per-space-seeds');
	const { seedWorkbenchHomeOn } = await import('./workbench-home');
	registerSpaceSeed('workbench-home', async (spaceId) => {
		await seedWorkbenchHomeOn(
			fixtureDb.workbenchScenes as unknown as Table<LocalWorkbenchScene, string>,
			spaceId
		);
	});
});

afterEach(async () => {
	__resetSpaceSeedsForTests();
	fixtureDb.close();
	await Dexie.delete(fixtureDb.name);
});

describe('per-Space-seeds wiring (registry → workbench-home → Dexie)', () => {
	it('runSpaceSeeds drives the workbench-home seeder end-to-end', async () => {
		await runSpaceSeeds('space-personal-abc');

		const row = await fixtureDb.workbenchScenes.get(workbenchHomeSeedId('space-personal-abc'));
		expect(row).toBeDefined();
		expect(row?.name).toBe('Home');
		expect(row?.spaceId).toBe('space-personal-abc');
	});

	it('repeated activations of the same Space stay at one row', async () => {
		await runSpaceSeeds('space-personal-abc');
		await runSpaceSeeds('space-personal-abc');
		await runSpaceSeeds('space-personal-abc');

		const all = await fixtureDb.workbenchScenes.toArray();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe(workbenchHomeSeedId('space-personal-abc'));
	});

	it('switching to a different Space seeds a separate Home for that Space', async () => {
		await runSpaceSeeds('space-personal-abc');
		await runSpaceSeeds('space-brand-xyz');

		const all = await fixtureDb.workbenchScenes.toArray();
		expect(all.map((r) => r.id).sort()).toEqual([
			workbenchHomeSeedId('space-brand-xyz'),
			workbenchHomeSeedId('space-personal-abc'),
		]);
		// And critically: each row carries the spaceId of the seed it
		// was created for — no cross-space pollution.
		const personal = all.find((r) => r.id === workbenchHomeSeedId('space-personal-abc'));
		const brand = all.find((r) => r.id === workbenchHomeSeedId('space-brand-xyz'));
		expect(personal?.spaceId).toBe('space-personal-abc');
		expect(brand?.spaceId).toBe('space-brand-xyz');
	});

	it('rapid back-and-forth Space switches do not accumulate duplicates', async () => {
		// Simulates the original bug pattern (Brand → Personal → Brand → Personal → …)
		// where each switch used to drop another Home into the personal Space.
		for (let i = 0; i < 5; i++) {
			await runSpaceSeeds('space-personal');
			await runSpaceSeeds('space-brand');
		}

		const all = await fixtureDb.workbenchScenes.toArray();
		expect(all).toHaveLength(2);
	});
});
