import { describe, it, expect, beforeEach } from 'vitest';
import { runAs, runAsAsync, getCurrentActor, USER_ACTOR, isAiActor, isSystemActor } from './actor';
import { emitDomainEvent } from './emit';
import { eventBus } from './event-bus';
import type { DomainEvent } from './types';

const AI_ACTOR = {
	kind: 'ai',
	missionId: 'm-1',
	iterationId: 'i-1',
	rationale: 'test',
} as const;

const SYSTEM_ACTOR = { kind: 'system', source: 'projection' } as const;

describe('actor context', () => {
	it('defaults to the user actor', () => {
		expect(getCurrentActor()).toEqual(USER_ACTOR);
	});

	it('pins the actor inside runAs and restores on exit', () => {
		runAs(AI_ACTOR, () => {
			expect(isAiActor(getCurrentActor())).toBe(true);
		});
		expect(getCurrentActor()).toEqual(USER_ACTOR);
	});

	it('recognises the system actor', () => {
		runAs(SYSTEM_ACTOR, () => {
			expect(isSystemActor(getCurrentActor())).toBe(true);
			expect(isAiActor(getCurrentActor())).toBe(false);
		});
	});

	it('restores the previous actor even when the body throws', () => {
		expect(() =>
			runAs(AI_ACTOR, () => {
				throw new Error('boom');
			})
		).toThrow('boom');
		expect(getCurrentActor()).toEqual(USER_ACTOR);
	});

	it('supports nesting', () => {
		runAs({ ...AI_ACTOR, missionId: 'outer' }, () => {
			expect((getCurrentActor() as { missionId: string }).missionId).toBe('outer');
			runAs({ ...AI_ACTOR, missionId: 'inner' }, () => {
				expect((getCurrentActor() as { missionId: string }).missionId).toBe('inner');
			});
			expect((getCurrentActor() as { missionId: string }).missionId).toBe('outer');
		});
	});

	it('preserves the actor across awaits inside runAsAsync', async () => {
		await runAsAsync({ ...AI_ACTOR, missionId: 'async' }, async () => {
			await Promise.resolve();
			expect((getCurrentActor() as { missionId: string }).missionId).toBe('async');
		});
		expect(getCurrentActor()).toEqual(USER_ACTOR);
	});
});

describe('emitDomainEvent actor attribution', () => {
	let received: DomainEvent[] = [];

	beforeEach(() => {
		received = [];
	});

	it('stamps the ambient actor onto the event meta', async () => {
		const unsub = eventBus.on('TestEvent', (e) => received.push(e));
		try {
			runAs(AI_ACTOR, () => {
				emitDomainEvent('TestEvent', 'todo', 'tasks', 'rec-1', { n: 1 });
			});
			await new Promise((r) => queueMicrotask(() => r(undefined)));
			expect(received).toHaveLength(1);
			expect(received[0].meta.actor).toEqual(AI_ACTOR);
		} finally {
			unsub();
		}
	});

	it('defaults to the user actor outside runAs', async () => {
		const unsub = eventBus.on('TestEvent', (e) => received.push(e));
		try {
			emitDomainEvent('TestEvent', 'todo', 'tasks', 'rec-2', { n: 2 });
			await new Promise((r) => queueMicrotask(() => r(undefined)));
			expect(received[0].meta.actor).toEqual(USER_ACTOR);
		} finally {
			unsub();
		}
	});

	it('honours an explicit actor in options over the ambient one', async () => {
		const unsub = eventBus.on('TestEvent', (e) => received.push(e));
		try {
			runAs(AI_ACTOR, () => {
				emitDomainEvent('TestEvent', 'todo', 'tasks', 'rec-3', { n: 3 }, { actor: SYSTEM_ACTOR });
			});
			await new Promise((r) => queueMicrotask(() => r(undefined)));
			expect(received[0].meta.actor).toEqual(SYSTEM_ACTOR);
		} finally {
			unsub();
		}
	});

	it('carries causedBy through the options bag', async () => {
		const unsub = eventBus.on('TestEvent', (e) => received.push(e));
		try {
			emitDomainEvent('TestEvent', 'todo', 'tasks', 'rec-4', { n: 4 }, { causedBy: 'parent-id' });
			await new Promise((r) => queueMicrotask(() => r(undefined)));
			expect(received[0].meta.causedBy).toBe('parent-id');
		} finally {
			unsub();
		}
	});
});
