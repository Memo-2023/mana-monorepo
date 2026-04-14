import { describe, it, expect } from 'vitest';
import { bucketByIteration } from './queries';
import type { DomainEvent } from '../../events/types';
import { USER_ACTOR } from '../../events/actor';

function aiEvent(
	missionId: string,
	iterationId: string,
	rationale: string,
	timestamp: string,
	type = 'TaskCreated'
): DomainEvent {
	return {
		type,
		payload: {},
		meta: {
			id: crypto.randomUUID(),
			timestamp,
			appId: 'todo',
			collection: 'tasks',
			recordId: crypto.randomUUID(),
			userId: 'u1',
			actor: { kind: 'ai', missionId, iterationId, rationale },
		},
	};
}

function userEvent(timestamp: string): DomainEvent {
	return {
		type: 'TaskCreated',
		payload: {},
		meta: {
			id: crypto.randomUUID(),
			timestamp,
			appId: 'todo',
			collection: 'tasks',
			recordId: crypto.randomUUID(),
			userId: 'u1',
			actor: USER_ACTOR,
		},
	};
}

describe('bucketByIteration', () => {
	it('groups events sharing iterationId', () => {
		const buckets = bucketByIteration([
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:00Z'),
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:02Z'),
			aiEvent('m-1', 'it-2', 'r2', '2026-04-14T11:00:00Z'),
		]);
		expect(buckets).toHaveLength(2);
		expect(buckets[0].iterationId).toBe('it-2'); // sorted desc by firstTimestamp
		expect(buckets[1].events).toHaveLength(2);
	});

	it('ignores user events entirely', () => {
		const buckets = bucketByIteration([
			userEvent('2026-04-14T10:00:00Z'),
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:01Z'),
		]);
		expect(buckets).toHaveLength(1);
		expect(buckets[0].events).toHaveLength(1);
	});

	it('uses the earliest timestamp of the group as the bucket anchor', () => {
		const buckets = bucketByIteration([
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:05Z'),
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:00Z'),
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:10Z'),
		]);
		expect(buckets).toHaveLength(1);
		expect(buckets[0].firstTimestamp).toBe('2026-04-14T10:00:00Z');
	});

	it('separates events from different missions even at the same iterationId', () => {
		const buckets = bucketByIteration([
			aiEvent('m-1', 'it-1', 'r', '2026-04-14T10:00:00Z'),
			aiEvent('m-2', 'it-1', 'r', '2026-04-14T10:00:01Z'),
		]);
		expect(buckets).toHaveLength(2);
	});
});
