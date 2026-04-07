/**
 * Tests for the local activity log.
 *
 * Two layers:
 *   - Direct read API tests (insert via db.add, then query)
 *   - Hook integration: a write to a sync-tracked table should auto-
 *     populate the activity log via the database.ts hooks
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from './database';
import {
	getRecentActivity,
	pruneActivityLog,
	ACTIVITY_TTL_MS,
	type ActivityEntry,
} from './activity';
import { setCurrentUserId } from './current-user';

const flushAsync = () => new Promise((r) => setTimeout(r, 10));

describe('activity log', () => {
	beforeEach(async () => {
		setCurrentUserId('test-user');
		await db.table('_activity').clear();
		await db.table('tasks').clear();
		await db.table('_pendingChanges').clear();
	});

	it('records an insert from a Dexie hook write', async () => {
		await db.table('tasks').add({
			id: 'task-act-1',
			title: 'first',
			priority: 'medium',
			isCompleted: false,
			order: 0,
		});
		await flushAsync(); // trackActivity is setTimeout-deferred

		const recent = await getRecentActivity({ collection: 'tasks', recordId: 'task-act-1' });
		expect(recent).toHaveLength(1);
		expect(recent[0].op).toBe('insert');
		expect(recent[0].appId).toBe('todo');
		expect(recent[0].userId).toBe('test-user');
	});

	it('records both an update and a delete on the same record', async () => {
		await db.table('tasks').add({
			id: 'task-act-2',
			title: 'edit me',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		await db.table('tasks').update('task-act-2', { title: 'edited' });
		await flushAsync();

		await db.table('tasks').update('task-act-2', { deletedAt: new Date().toISOString() });
		await flushAsync();

		const history = await getRecentActivity({ collection: 'tasks', recordId: 'task-act-2' });
		// Newest first: delete, update, insert
		expect(history.map((e) => e.op)).toEqual(['delete', 'update', 'insert']);
	});

	it('filters by appId via the compound index', async () => {
		setCurrentUserId('test-user');
		await db.table('tasks').add({
			id: 'task-app-1',
			title: 'todo entry',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await db.table('cards').add({
			id: 'card-app-1',
			deckId: 'deck-x',
			front: 'Q',
			back: 'A',
			difficulty: 0,
			reviewCount: 0,
			order: 0,
		});
		await flushAsync();

		const todoOnly = await getRecentActivity({ appId: 'todo' });
		expect(todoOnly.every((e) => e.appId === 'todo')).toBe(true);
		expect(todoOnly.some((e) => e.recordId === 'task-app-1')).toBe(true);

		const cardsOnly = await getRecentActivity({ appId: 'cards' });
		expect(cardsOnly.every((e) => e.appId === 'cards')).toBe(true);
	});

	it('isolates entries to the active user', async () => {
		setCurrentUserId('user-a');
		await db.table('tasks').add({
			id: 'task-user-a',
			title: 'a',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		setCurrentUserId('user-b');
		await db.table('tasks').add({
			id: 'task-user-b',
			title: 'b',
			priority: 'low',
			isCompleted: false,
			order: 0,
		});
		await flushAsync();

		// Active user is now user-b
		const visible = await getRecentActivity();
		expect(visible.every((e) => e.userId === 'user-b')).toBe(true);
		expect(visible.some((e) => e.recordId === 'task-user-a')).toBe(false);
	});

	it('respects the limit option', async () => {
		for (let i = 0; i < 10; i++) {
			await db.table('tasks').add({
				id: `task-limit-${i}`,
				title: `t${i}`,
				priority: 'low',
				isCompleted: false,
				order: i,
			});
		}
		await flushAsync();

		const limited = await getRecentActivity({ limit: 3 });
		expect(limited.length).toBeLessThanOrEqual(3);
	});

	it('prunes entries older than the TTL', async () => {
		// Manually insert two old entries (createdAt < cutoff) so we don't
		// have to wait or fake the system clock.
		const oldDate = new Date(Date.now() - ACTIVITY_TTL_MS - 1000).toISOString();
		const fresh = new Date().toISOString();
		await db.table('_activity').bulkAdd([
			{
				createdAt: oldDate,
				appId: 'todo',
				collection: 'tasks',
				recordId: 'old-1',
				op: 'insert',
				userId: 'test-user',
			},
			{
				createdAt: oldDate,
				appId: 'todo',
				collection: 'tasks',
				recordId: 'old-2',
				op: 'insert',
				userId: 'test-user',
			},
			{
				createdAt: fresh,
				appId: 'todo',
				collection: 'tasks',
				recordId: 'fresh-1',
				op: 'insert',
				userId: 'test-user',
			},
		] as ActivityEntry[]);

		const pruned = await pruneActivityLog();
		expect(pruned).toBe(2);

		const remaining = await db.table('_activity').toArray();
		expect(remaining).toHaveLength(1);
		expect((remaining[0] as ActivityEntry).recordId).toBe('fresh-1');
	});
});
