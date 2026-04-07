/**
 * Tests for the sync engine.
 *
 * Two layers:
 *   1. Pure tests for the wire-format guards and helpers — no IndexedDB
 *      needed, run anywhere vitest runs.
 *   2. Integration tests for `applyServerChanges` against an in-memory
 *      Dexie db via `fake-indexeddb/auto`. These exercise the field-level
 *      LWW logic that Sprint 1 introduced.
 *
 * NOTE on running locally: the monorepo's vitest install is currently
 * tangled across multiple `@vitest/*` versions in the lockfile (3.x and
 * 4.x mixed). The pure tests below are written so they pass on any vitest
 * 4.x; the integration block additionally needs `fake-indexeddb` (already
 * a devDependency). Once vitest is realigned, `pnpm test` should pick this
 * file up automatically — no separate config required.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub the side-effect modules the Dexie hooks reach into so importing
// `database.ts` doesn't try to load funnel-tracking, automation triggers,
// or inline suggestions. The hooks themselves still run; their side
// effects are just no-ops.
vi.mock('$lib/stores/funnel-tracking', () => ({
	trackFirstContent: vi.fn(),
}));
vi.mock('$lib/triggers/registry', () => ({
	fire: vi.fn(),
}));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import {
	isValidSyncChange,
	readFieldTimestamps,
	applyServerChanges,
	type SyncChange,
} from './sync';
import { db, FIELD_TIMESTAMPS_KEY } from './database';

// ─── Pure tests ──────────────────────────────────────────────────

describe('isValidSyncChange', () => {
	const baseInsert: SyncChange = {
		table: 'tasks',
		id: 'task-1',
		op: 'insert',
		data: { title: 'hello' },
	};

	it('accepts a well-formed insert change', () => {
		expect(isValidSyncChange(baseInsert)).toBe(true);
	});

	it('accepts a well-formed update change with field timestamps', () => {
		const change: SyncChange = {
			table: 'tasks',
			id: 'task-1',
			op: 'update',
			fields: {
				title: { value: 'updated', updatedAt: '2026-04-01T10:00:00Z' },
				priority: { value: 'high', updatedAt: '2026-04-01T10:01:00Z' },
			},
		};
		expect(isValidSyncChange(change)).toBe(true);
	});

	it('accepts a delete change with deletedAt', () => {
		const change: SyncChange = {
			table: 'tasks',
			id: 'task-1',
			op: 'delete',
			deletedAt: '2026-04-01T10:00:00Z',
		};
		expect(isValidSyncChange(change)).toBe(true);
	});

	it('rejects null and primitives', () => {
		expect(isValidSyncChange(null)).toBe(false);
		expect(isValidSyncChange(undefined)).toBe(false);
		expect(isValidSyncChange('not an object')).toBe(false);
		expect(isValidSyncChange(42)).toBe(false);
	});

	it('rejects when table is missing or empty', () => {
		expect(isValidSyncChange({ ...baseInsert, table: '' })).toBe(false);
		expect(isValidSyncChange({ ...baseInsert, table: undefined })).toBe(false);
	});

	it('rejects when id is missing or empty', () => {
		expect(isValidSyncChange({ ...baseInsert, id: '' })).toBe(false);
		expect(isValidSyncChange({ ...baseInsert, id: undefined })).toBe(false);
	});

	it('rejects unknown op values', () => {
		expect(isValidSyncChange({ ...baseInsert, op: 'upsert' })).toBe(false);
		expect(isValidSyncChange({ ...baseInsert, op: '' })).toBe(false);
	});

	it('rejects malformed fields map', () => {
		// Inner value is not a FieldChange object
		expect(
			isValidSyncChange({
				...baseInsert,
				op: 'update',
				fields: { title: 'just a string' },
			})
		).toBe(false);

		// updatedAt must be a string when present
		expect(
			isValidSyncChange({
				...baseInsert,
				op: 'update',
				fields: { title: { value: 'x', updatedAt: 12345 } },
			})
		).toBe(false);
	});

	it('rejects when data is a primitive', () => {
		expect(isValidSyncChange({ ...baseInsert, data: 'not an object' })).toBe(false);
	});

	it('rejects when deletedAt is not a string', () => {
		expect(isValidSyncChange({ ...baseInsert, deletedAt: 123 })).toBe(false);
	});
});

describe('readFieldTimestamps', () => {
	it('returns the field-timestamps map when present', () => {
		const ft = { title: '2026-04-01T10:00:00Z', priority: '2026-04-01T11:00:00Z' };
		const record = { id: 'x', [FIELD_TIMESTAMPS_KEY]: ft };
		expect(readFieldTimestamps(record)).toEqual(ft);
	});

	it('returns an empty map when the field is missing (legacy record)', () => {
		expect(readFieldTimestamps({ id: 'x' })).toEqual({});
	});

	it('handles null and non-object inputs gracefully', () => {
		expect(readFieldTimestamps(null)).toEqual({});
		expect(readFieldTimestamps(undefined)).toEqual({});
		expect(readFieldTimestamps(42)).toEqual({});
	});

	it('returns an empty map if __fieldTimestamps is not an object', () => {
		expect(readFieldTimestamps({ id: 'x', [FIELD_TIMESTAMPS_KEY]: 'not-a-map' })).toEqual({});
	});
});

// ─── Integration tests against the unified Dexie db ─────────────

describe('applyServerChanges (Dexie integration)', () => {
	beforeEach(async () => {
		// Wipe every sync-tracked table plus the bookkeeping ones so each
		// test starts from a clean slate.
		const tables = ['tasks', '_pendingChanges', '_syncMeta'];
		for (const t of tables) {
			try {
				await db.table(t).clear();
			} catch {
				// Table may not exist in this Dexie version — ignore.
			}
		}
	});

	it('inserts a new record with __fieldTimestamps populated', async () => {
		await applyServerChanges('todo', [
			{
				table: 'tasks',
				id: 'task-A',
				op: 'insert',
				data: {
					id: 'task-A',
					title: 'Buy milk',
					priority: 'medium',
					isCompleted: false,
					order: 0,
					updatedAt: '2026-04-01T10:00:00Z',
				},
			},
		]);

		const stored = await db.table('tasks').get('task-A');
		expect(stored).toBeDefined();
		expect(stored.title).toBe('Buy milk');
		const ft = readFieldTimestamps(stored);
		expect(ft.title).toBe('2026-04-01T10:00:00Z');
		expect(ft.priority).toBe('2026-04-01T10:00:00Z');
	});

	it('field-level LWW: server wins per-field when newer', async () => {
		// Seed a local record via the regular Dexie API so the creating-hook
		// stamps it. We can't use applyServerChanges to seed because it
		// suppresses the hook; we want a *real* local record here.
		await db.table('tasks').add({
			id: 'task-B',
			title: 'old title',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});

		// Server sends an update with NEWER timestamps for both fields.
		await applyServerChanges('todo', [
			{
				table: 'tasks',
				id: 'task-B',
				op: 'update',
				fields: {
					title: { value: 'new title', updatedAt: '2099-01-01T00:00:00Z' },
					priority: { value: 'high', updatedAt: '2099-01-01T00:00:00Z' },
				},
			},
		]);

		const stored = await db.table('tasks').get('task-B');
		expect(stored.title).toBe('new title');
		expect(stored.priority).toBe('high');

		const ft = readFieldTimestamps(stored);
		expect(ft.title).toBe('2099-01-01T00:00:00Z');
		expect(ft.priority).toBe('2099-01-01T00:00:00Z');
	});

	it('field-level LWW: split outcome when one field is newer and one older', async () => {
		// Seed local with field timestamps slightly in the future.
		await db.table('tasks').add({
			id: 'task-C',
			title: 'local title',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});

		// Manually overwrite __fieldTimestamps so we can test the comparison
		// against precise values. Use the in-progress applyingServerChanges
		// flag indirectly by going through applyServerChanges with an insert
		// op that overwrites field timestamps. Easier: just patch via update
		// which the hook will handle by merging.
		await db.table('tasks').update('task-C', {
			title: 'local title v2',
			priority: 'urgent',
		});

		// Now apply a server change where:
		//   - title server timestamp is OLDER → local wins
		//   - priority server timestamp is NEWER → server wins
		await applyServerChanges('todo', [
			{
				table: 'tasks',
				id: 'task-C',
				op: 'update',
				fields: {
					title: { value: 'server title (loser)', updatedAt: '1970-01-01T00:00:00Z' },
					priority: { value: 'medium (winner)', updatedAt: '2099-01-01T00:00:00Z' },
				},
			},
		]);

		const stored = await db.table('tasks').get('task-C');
		expect(stored.title).toBe('local title v2'); // local field kept
		expect(stored.priority).toBe('medium (winner)'); // server field applied
	});

	it('soft delete is applied when server timestamp is newer than local', async () => {
		await db.table('tasks').add({
			id: 'task-D',
			title: 'doomed',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});

		await applyServerChanges('todo', [
			{
				table: 'tasks',
				id: 'task-D',
				op: 'update',
				deletedAt: '2099-01-01T00:00:00Z',
			},
		]);

		const stored = await db.table('tasks').get('task-D');
		expect(stored).toBeDefined();
		expect(stored.deletedAt).toBe('2099-01-01T00:00:00Z');
	});

	it('drops malformed entries but still applies the valid ones in the same batch', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			await applyServerChanges('todo', [
				// Malformed: missing id
				{ table: 'tasks', op: 'insert', data: { title: 'orphan' } },
				// Valid
				{
					table: 'tasks',
					id: 'task-E',
					op: 'insert',
					data: {
						id: 'task-E',
						title: 'survives',
						priority: 'low',
						isCompleted: false,
						order: 0,
					},
				},
			]);

			expect(warn).toHaveBeenCalledOnce();
			const stored = await db.table('tasks').get('task-E');
			expect(stored).toBeDefined();
			expect(stored.title).toBe('survives');
		} finally {
			warn.mockRestore();
		}
	});

	it('does not generate _pendingChanges entries for server-applied writes (sync loop guard)', async () => {
		await applyServerChanges('todo', [
			{
				table: 'tasks',
				id: 'task-F',
				op: 'insert',
				data: {
					id: 'task-F',
					title: 'echo me not',
					priority: 'low',
					isCompleted: false,
					order: 0,
				},
			},
		]);

		const pendingForTaskF = await db
			.table('_pendingChanges')
			.filter((p: { recordId?: string }) => p.recordId === 'task-F')
			.toArray();
		expect(pendingForTaskF).toEqual([]);
	});
});
