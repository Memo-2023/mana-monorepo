/**
 * Tests for the Dexie creating-hook's tenancy stamping. The hook in
 * `database.ts` calls `getEffectiveSpaceId()` on every write to a
 * space-scoped table that didn't pre-set `spaceId`, so:
 *
 *   - With an active Space loaded, writes land under that Space's UUID.
 *   - During the bootstrap window (no active Space), writes carry the
 *     personal sentinel `_personal:<userId>`, which `reconcileSentinels`
 *     rewrites once `loadActiveSpace` resolves the real id.
 *   - An explicitly-set spaceId on the record is preserved verbatim.
 *
 * Before the smart hook landed, the literal `_personal:<userId>` was
 * stamped unconditionally — so writes during a Brand-Space session
 * silently routed to Personal after `reconcileSentinels` rewrote them.
 * The tests here are the regression guard for that bug.
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from './database';
import { setCurrentUserId } from './current-user';
import { setActiveSpace } from './scope/active-space.svelte';
import type { ActiveSpace } from './scope/active-space.svelte';

const brandSpace: ActiveSpace = {
	id: 'space-brand-uuid',
	slug: 'acme',
	name: 'Acme Brand',
	type: 'brand',
	tier: 'public',
	role: 'owner',
};

beforeEach(async () => {
	setCurrentUserId('test-user');
	setActiveSpace(null);
	await db.table('tasks').clear();
});

afterEach(() => {
	setActiveSpace(null);
	setCurrentUserId(null);
});

describe('creating-hook tenancy stamping', () => {
	it('stamps the active Space id when one is loaded', async () => {
		setActiveSpace(brandSpace);

		await db.table('tasks').add({
			id: 'task-stamp-1',
			title: 'in brand',
			priority: 'medium',
			isCompleted: false,
			order: 0,
		});

		const row = await db.table('tasks').get('task-stamp-1');
		expect(row?.spaceId).toBe('space-brand-uuid');
	});

	it('falls back to the personal sentinel when no Space is loaded', async () => {
		await db.table('tasks').add({
			id: 'task-stamp-2',
			title: 'no space yet',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});

		const row = await db.table('tasks').get('task-stamp-2');
		expect(row?.spaceId).toBe('_personal:test-user');
	});

	it('preserves an explicitly-set spaceId verbatim', async () => {
		// Cross-space write pattern (e.g. workbench-home seeder
		// writing into a target Space that isn't the active one).
		setActiveSpace(brandSpace);

		await db.table('tasks').add({
			id: 'task-stamp-3',
			title: 'forced personal',
			priority: 'medium',
			isCompleted: false,
			order: 0,
			spaceId: 'space-explicit-target',
		});

		const row = await db.table('tasks').get('task-stamp-3');
		expect(row?.spaceId).toBe('space-explicit-target');
	});

	it('updates the stamp when the active Space changes between writes', async () => {
		setActiveSpace(brandSpace);
		await db.table('tasks').add({
			id: 'task-stamp-4a',
			title: 'first',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});

		setActiveSpace(null);
		await db.table('tasks').add({
			id: 'task-stamp-4b',
			title: 'second',
			priority: 'low',
			isCompleted: false,
			order: 1,
		});

		const a = await db.table('tasks').get('task-stamp-4a');
		const b = await db.table('tasks').get('task-stamp-4b');
		expect(a?.spaceId).toBe('space-brand-uuid');
		expect(b?.spaceId).toBe('_personal:test-user');
	});
});
