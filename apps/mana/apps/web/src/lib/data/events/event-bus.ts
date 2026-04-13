/**
 * EventBus — Synchronous in-process event dispatcher.
 *
 * Handlers are invoked via queueMicrotask so they run after the current
 * Dexie transaction commits but before the next frame — no setTimeout
 * delay, no transaction interference.
 *
 * A re-entrancy guard prevents infinite loops when a handler emits
 * another event of the same type.
 */

import type { DomainEvent, EventBus, EventHandler } from './types';

export function createEventBus(): EventBus {
	const handlers = new Map<string, Set<EventHandler>>();
	const anyHandlers = new Set<EventHandler>();
	const emitting = new Set<string>();

	return {
		emit(event: DomainEvent) {
			queueMicrotask(() => {
				if (emitting.has(event.type)) {
					console.warn(`[event-bus] re-entrant emit blocked: ${event.type}`);
					return;
				}
				emitting.add(event.type);
				try {
					const typeHandlers = handlers.get(event.type);
					if (typeHandlers) {
						for (const h of typeHandlers) {
							try {
								h(event);
							} catch (err) {
								console.error(`[event-bus] handler error for ${event.type}:`, err);
							}
						}
					}
					for (const h of anyHandlers) {
						try {
							h(event);
						} catch (err) {
							console.error(`[event-bus] anyHandler error for ${event.type}:`, err);
						}
					}
				} finally {
					emitting.delete(event.type);
				}
			});
		},

		on(type, handler) {
			if (!handlers.has(type)) handlers.set(type, new Set());
			handlers.get(type)!.add(handler);
			return () => handlers.get(type)?.delete(handler);
		},

		onAny(handler) {
			anyHandlers.add(handler);
			return () => anyHandlers.delete(handler);
		},

		off(type, handler) {
			handlers.get(type)?.delete(handler);
		},
	};
}

/** Singleton bus shared across the entire app. */
export const eventBus: EventBus = createEventBus();
