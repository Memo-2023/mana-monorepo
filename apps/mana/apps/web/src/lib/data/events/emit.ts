/**
 * Convenience helper for emitting domain events from module stores.
 *
 * Builds the EventMeta automatically so stores only need to specify the event
 * type, routing info, payload, and (optionally) an explicit actor / cause.
 */

import { eventBus } from './event-bus';
import { getEffectiveUserId } from '../current-user';
import { getCurrentActor } from './actor';
import type { Actor } from './actor';
import type { DomainEvent } from './types';

export interface EmitOptions {
	/**
	 * Who triggered this event. Defaults to the ambient actor set by `runAs`
	 * (which is `{ kind: 'user' }` when nothing else is active). Pass an
	 * explicit actor when crossing async boundaries where ambient context
	 * can't be trusted (e.g. deferred `setTimeout` callbacks).
	 */
	actor?: Actor;
	/** Parent event ID (for trigger chains / cascades). */
	causedBy?: string;
}

/**
 * Emit a domain event on the shared bus.
 */
export function emitDomainEvent<P>(
	type: string,
	appId: string,
	collection: string,
	recordId: string,
	payload: P,
	opts: EmitOptions = {}
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
			actor: opts.actor ?? getCurrentActor(),
			causedBy: opts.causedBy,
		},
	};
	eventBus.emit(event);
}
