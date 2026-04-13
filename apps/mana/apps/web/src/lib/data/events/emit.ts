/**
 * Convenience helper for emitting domain events from module stores.
 *
 * Builds the EventMeta automatically so stores only need to specify
 * the event type, routing info, and payload.
 */

import { eventBus } from './event-bus';
import { getEffectiveUserId } from '../current-user';
import type { DomainEvent } from './types';

/**
 * Emit a domain event on the shared bus.
 *
 * @example
 * ```ts
 * emitDomainEvent('TaskCompleted', 'todo', 'tasks', id, {
 *   taskId: id, title: task.title, wasOverdue: true,
 * });
 * ```
 */
export function emitDomainEvent<P>(
	type: string,
	appId: string,
	collection: string,
	recordId: string,
	payload: P,
	causedBy?: string
): void {
	const event: DomainEvent<string, P> = {
		type,
		payload,
		meta: {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			appId,
			collection,
			recordId,
			userId: getEffectiveUserId(),
			causedBy,
		},
	};
	eventBus.emit(event);
}
