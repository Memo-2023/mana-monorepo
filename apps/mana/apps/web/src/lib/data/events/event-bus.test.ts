/**
 * EventBus tests.
 *
 * Tests the createEventBus factory function with synchronous assertions.
 * Note: The real bus uses queueMicrotask for async delivery, but
 * these tests verify the subscription/routing logic by directly
 * calling handlers after a flush.
 */

import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from './event-bus';
import { USER_ACTOR } from './actor';
import type { DomainEvent } from './types';

function makeEvent(type: string, payload: unknown = {}): DomainEvent {
	return {
		type,
		payload,
		meta: {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			appId: 'test',
			collection: 'test',
			recordId: '1',
			userId: 'user1',
			actor: USER_ACTOR,
		},
	};
}

const flush = () => new Promise<void>((r) => setTimeout(r, 20));

describe('EventBus', () => {
	it('delivers events to typed subscribers', async () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on('TaskCreated', handler);

		bus.emit(makeEvent('TaskCreated', { title: 'Test' }));
		await flush();

		expect(handler).toHaveBeenCalledOnce();
		expect(handler.mock.calls[0][0].payload).toEqual({ title: 'Test' });
	});

	it('does not deliver events to wrong type', async () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on('DrinkLogged', handler);

		bus.emit(makeEvent('TaskCreated'));
		await flush();

		expect(handler).not.toHaveBeenCalled();
	});

	it('delivers events to onAny subscribers', async () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.onAny(handler);

		bus.emit(makeEvent('TaskCreated'));
		bus.emit(makeEvent('DrinkLogged'));
		await flush();

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('unsubscribes via returned function', async () => {
		const bus = createEventBus();
		const handler = vi.fn();
		const unsub = bus.on('TaskCreated', handler);

		bus.emit(makeEvent('TaskCreated'));
		await flush();
		expect(handler).toHaveBeenCalledOnce();

		unsub();
		bus.emit(makeEvent('TaskCreated'));
		await flush();
		expect(handler).toHaveBeenCalledOnce();
	});

	it('off() removes handler', async () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on('Test', handler);

		bus.off('Test', handler);
		bus.emit(makeEvent('Test'));
		await flush();

		expect(handler).not.toHaveBeenCalled();
	});

	it('isolates errors between handlers', async () => {
		const bus = createEventBus();
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const errorHandler = vi.fn(() => {
			throw new Error('boom');
		});
		const goodHandler = vi.fn();

		bus.on('Test', errorHandler);
		bus.on('Test', goodHandler);

		bus.emit(makeEvent('Test'));
		await flush();

		expect(errorHandler).toHaveBeenCalledOnce();
		expect(goodHandler).toHaveBeenCalledOnce();
		spy.mockRestore();
	});

	it('supports multiple handlers for same type', async () => {
		const bus = createEventBus();
		const h1 = vi.fn();
		const h2 = vi.fn();
		bus.on('Test', h1);
		bus.on('Test', h2);

		bus.emit(makeEvent('Test'));
		await flush();

		expect(h1).toHaveBeenCalledOnce();
		expect(h2).toHaveBeenCalledOnce();
	});
});
