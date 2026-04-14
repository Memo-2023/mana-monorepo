import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '../../database';
import { USER_ACTOR } from '../../events/actor';
import { revertIteration } from './revert-iteration';
import { registerInverseOperation } from './inverse-operations';

const EVENTS_TABLE = '_events';

function aiEvent(
	type: string,
	missionId: string,
	iterationId: string,
	payload: Record<string, unknown>,
	timestamp: string
) {
	return {
		type,
		payload,
		meta: {
			id: crypto.randomUUID(),
			timestamp,
			appId: 'test',
			collection: 'test',
			recordId: (payload.taskId as string | undefined) ?? 'r',
			userId: 'u',
			actor: {
				kind: 'ai' as const,
				missionId,
				iterationId,
				rationale: 'r',
			},
		},
	};
}

beforeEach(async () => {
	await db.table(EVENTS_TABLE).clear();
});

describe('revertIteration', () => {
	it('runs the inverse for every ai event in the iteration', async () => {
		const calls: string[] = [];
		registerInverseOperation('RevertTestCreated', async (p) => {
			calls.push(p.id as string);
			return { ok: true };
		});

		await db.table(EVENTS_TABLE).bulkAdd([
			aiEvent('RevertTestCreated', 'm-1', 'it-1', { id: 'a' }, '2026-04-15T10:00:00Z'),
			aiEvent('RevertTestCreated', 'm-1', 'it-1', { id: 'b' }, '2026-04-15T10:00:01Z'),
			// different iteration — should not be reverted
			aiEvent('RevertTestCreated', 'm-1', 'it-2', { id: 'c' }, '2026-04-15T10:00:02Z'),
		]);

		const stats = await revertIteration('m-1', 'it-1');
		expect(stats.total).toBe(2);
		expect(stats.reverted).toBe(2);
		expect(stats.failed).toBe(0);
		expect(calls.sort()).toEqual(['a', 'b']);
	});

	it('tallies unsupported event types separately', async () => {
		await db
			.table(EVENTS_TABLE)
			.bulkAdd([aiEvent('UnknownEventType', 'm-1', 'it-x', { id: 'z' }, '2026-04-15T10:00:00Z')]);

		const stats = await revertIteration('m-1', 'it-x');
		expect(stats.skippedUnsupported).toBe(1);
		expect(stats.reverted).toBe(0);
	});

	it('records failures without throwing', async () => {
		registerInverseOperation('RevertBrokenEvent', async () => {
			throw new Error('broken');
		});
		await db
			.table(EVENTS_TABLE)
			.bulkAdd([aiEvent('RevertBrokenEvent', 'm-1', 'it-f', { id: 'x' }, '2026-04-15T10:00:00Z')]);

		const stats = await revertIteration('m-1', 'it-f');
		expect(stats.failed).toBe(1);
		expect(stats.failures[0].reason).toContain('broken');
	});

	it('ignores user-initiated events from the same record', async () => {
		await db.table(EVENTS_TABLE).bulkAdd([
			{
				type: 'RevertTestCreated',
				payload: { id: 'user-made' },
				meta: {
					id: crypto.randomUUID(),
					timestamp: '2026-04-15T10:00:00Z',
					appId: 'test',
					collection: 'test',
					recordId: 'user-made',
					userId: 'u',
					actor: USER_ACTOR,
				},
			},
		]);
		const stats = await revertIteration('m-1', 'it-user');
		expect(stats.total).toBe(0);
	});

	it('processes newest-first so dependent events unwind cleanly', async () => {
		const order: string[] = [];
		registerInverseOperation('RevertOrderTest', async (p) => {
			order.push(p.id as string);
			return { ok: true };
		});
		await db
			.table(EVENTS_TABLE)
			.bulkAdd([
				aiEvent('RevertOrderTest', 'm-1', 'it-o', { id: 'first' }, '2026-04-15T10:00:00Z'),
				aiEvent('RevertOrderTest', 'm-1', 'it-o', { id: 'second' }, '2026-04-15T10:00:01Z'),
				aiEvent('RevertOrderTest', 'm-1', 'it-o', { id: 'third' }, '2026-04-15T10:00:02Z'),
			]);
		await revertIteration('m-1', 'it-o');
		expect(order).toEqual(['third', 'second', 'first']);
	});
});
