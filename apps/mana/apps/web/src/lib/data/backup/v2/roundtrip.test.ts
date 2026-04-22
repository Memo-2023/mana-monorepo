/**
 * End-to-end roundtrip test for the v2 export/import pipeline against a
 * real (fake) Dexie. Format + passphrase are covered in format.test.ts;
 * this one verifies the orchestration layer:
 *
 *   - buildClientBackup reads from Dexie, walks MODULE_CONFIGS,
 *     decrypts rows, packages them into a `.mana` archive.
 *   - applyClientBackup unwraps (optionally unseals), re-encrypts, and
 *     `bulkPut`s back into Dexie.
 *   - userId stripping → the Dexie creating hook re-stamps with the
 *     current session's id, so a cross-account restore adopts rows.
 *   - Unknown tables in the archive (module since removed) are skipped,
 *     not fatal.
 *   - Passphrase sealing + unsealing through the full pipeline.
 *
 * Crypto is stubbed as pass-through — we're not testing AES here
 * (`format.test.ts` covers the sealing primitives). That keeps this
 * test focused on "does the data survive the export→import round?".
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

// Crypto pass-through — the registry is a full implementation in prod,
// but for this test we want the orchestration layer to hand us rows
// verbatim so we can assert on identity through the round-trip. If we
// didn't stub this, notes.body would come back wrapped in {alg, iv, ct}
// because the real registry knows `notes.body` is encrypted.
vi.mock('$lib/data/crypto', () => ({
	decryptRecords: vi.fn(async (_table: string, rows: Record<string, unknown>[]) => rows),
	encryptRecord: vi.fn(async (_table: string, _row: Record<string, unknown>) => {
		// no-op — mirrors decrypt as pass-through
	}),
}));

// Narrow module registry: just the two tables we're round-tripping.
// Keeps the test deterministic independent of new modules landing.
vi.mock('$lib/data/module-registry', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/data/module-registry')>();
	return {
		...actual,
		MODULE_CONFIGS: [
			{ appId: 'todo', tables: [{ name: 'tasks' }] },
			{ appId: 'notes', tables: [{ name: 'notes' }] },
		],
	};
});

vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: { user: { id: 'session-user' } },
}));

import { db } from '$lib/data/database';
import { setCurrentUserId } from '$lib/data/current-user';
import { buildClientBackup } from './export';
import { applyClientBackup } from './import';
import { readBackup } from './format';

const flushAsync = () => new Promise((r) => setTimeout(r, 10));

beforeEach(async () => {
	setCurrentUserId('session-user');
	await db.table('tasks').clear();
	await db.table('notes').clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('v2 export → import round-trip', () => {
	it('survives rows through buildClientBackup → applyClientBackup', async () => {
		await db.table('tasks').add({
			id: 'task-1',
			title: 'walk the dog',
			priority: 'medium',
			isCompleted: false,
			order: 0,
		});
		await db.table('notes').add({
			id: 'note-1',
			title: 'hello',
			body: 'world',
			isPinned: false,
			isArchived: false,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({ producedBy: 'test' });

		// Wipe local state to simulate restoring onto a fresh install.
		await db.table('tasks').clear();
		await db.table('notes').clear();
		await flushAsync();

		const result = await applyClientBackup(blob);
		expect(result.totalApplied).toBe(2);
		expect(result.skippedTables).toEqual([]);

		const tasks = await db.table('tasks').toArray();
		const notes = await db.table('notes').toArray();
		expect(tasks.map((t) => t.id)).toEqual(['task-1']);
		expect(notes.map((n) => n.id)).toEqual(['note-1']);
		expect(tasks[0].title).toBe('walk the dog');
		expect(notes[0].body).toBe('world');
	});

	it('filters scope by appId', async () => {
		await db.table('tasks').add({
			id: 'task-a',
			title: 't',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await db.table('notes').add({
			id: 'note-a',
			title: 'n',
			body: 'n',
			isPinned: false,
			isArchived: false,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({ appIds: ['todo'], producedBy: 'test' });

		const parsed = await readBackup(blob);
		if ('sealedData' in parsed) throw new Error('unexpected seal');
		expect(parsed.manifest.scope).toEqual({ type: 'filtered', appIds: ['todo'] });
		expect(Object.keys(parsed.tables)).toEqual(['tasks']);
	});

	it('adopts rows under the current session (spaceId re-stamped on data tables)', async () => {
		setCurrentUserId('original-user');
		await db.table('tasks').add({
			id: 'task-adopt',
			title: 'adopt me',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({ producedBy: 'test' });

		// Simulate the user signing in as a different account.
		setCurrentUserId('new-user');
		await db.table('tasks').clear();

		await applyClientBackup(blob);
		const row = await db.table('tasks').get('task-adopt');
		// After Phase 2c, data tables are scoped by spaceId, not userId.
		// The importer strips spaceId so the creating-hook re-stamps it
		// to the new user's personal-space sentinel.
		expect(row?.spaceId).toBe('_personal:new-user');
	});

	it('skips unknown tables instead of failing', async () => {
		await db.table('tasks').add({
			id: 'task-s',
			title: 't',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({ producedBy: 'test' });

		// Hand-build an archive with a phantom table the current build
		// doesn't know about. Easiest path: round-trip the real blob
		// through readBackup, inject a bogus entry, re-encode. Here we
		// just verify by importing a hand-crafted blob with a fake
		// table — the format test layer has already proven round-trip
		// fidelity, so we shortcut by checking skippedTables when the
		// archive contains a table not in our mocked MODULE_CONFIGS.
		// We can trigger this path by stashing a row into a table that
		// IS in Dexie but NOT in the mocked registry.
		await db.table('_activity').add({
			id: 'act-1',
			op: 'insert',
			collection: 'tasks',
			recordId: 'foo',
			userId: 'session-user',
			appId: 'todo',
			occurredAt: Date.now(),
		});

		// That row never gets into the backup (not in MODULE_CONFIGS),
		// so nothing to assert there. Instead: build a minimal archive
		// by hand that DOES declare an unknown table, and confirm the
		// importer skips it.
		// We reach under readBackup/buildBackup boundaries by importing
		// format.ts, which is public.
		const { buildBackup } = await import('./format');
		const fake = await buildBackup({
			manifest: {
				formatVersion: 2,
				schemaVersion: db.verno,
				producedBy: 'test',
				exportedAt: new Date().toISOString(),
				userId: 'session-user',
				scope: { type: 'full' },
				rowCounts: { wisekeep: 1 },
				fieldsPlaintext: true,
			},
			tables: { wisekeep: [{ id: 'w-1', body: 'gone' }] },
		});
		const result = await applyClientBackup(new Blob([fake as unknown as ArrayBuffer]));
		expect(result.skippedTables).toEqual(['wisekeep']);
		expect(result.totalApplied).toBe(0);
	});

	it('survives a passphrase-sealed round-trip', async () => {
		await db.table('tasks').add({
			id: 'task-sealed',
			title: 'secret',
			priority: 'high',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({
			passphrase: 'correct-horse-battery',
			producedBy: 'test',
		});

		// Confirm the outer archive doesn't leak plaintext.
		const parsed = await readBackup(blob);
		if (!('sealedData' in parsed)) throw new Error('expected sealed blob');
		expect(parsed.manifest.passphrase).toBeDefined();

		await db.table('tasks').clear();

		const result = await applyClientBackup(blob, { passphrase: 'correct-horse-battery' });
		expect(result.totalApplied).toBe(1);
		const row = await db.table('tasks').get('task-sealed');
		expect(row?.title).toBe('secret');
	});

	it('rejects a sealed archive opened with the wrong passphrase', async () => {
		await db.table('tasks').add({
			id: 'task-wrong',
			title: 's',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		const { blob } = await buildClientBackup({ passphrase: 'right', producedBy: 'test' });
		await expect(applyClientBackup(blob, { passphrase: 'wrong' })).rejects.toThrow(
			/wrong passphrase/
		);
	});
});
