/**
 * In-process pubsub for research progress events.
 *
 * Single-node only — keeps a Map<researchResultId, Set<subscriber>> in
 * memory. When apps/api scales horizontally, swap this for a Redis Pub/Sub
 * implementation behind the same publish/subscribe interface.
 *
 * Subscribers are kept until either the pipeline emits a terminal event
 * (`done` / `error`) or the consumer unsubscribes (e.g. SSE client closed).
 * Late subscribers do NOT receive backfilled events — the routes layer is
 * expected to read the current DB state once before subscribing.
 */

import type { ProgressEvent } from './orchestrator';

type Subscriber = (event: ProgressEvent) => void;

const channels = new Map<string, Set<Subscriber>>();

/**
 * Publish an event to all current subscribers of `researchResultId`.
 * Subscriber callbacks are wrapped in try/catch so a single misbehaving
 * listener cannot block the orchestrator's progress.
 */
export function publish(researchResultId: string, event: ProgressEvent): void {
	const subs = channels.get(researchResultId);
	if (!subs) return;
	for (const sub of subs) {
		try {
			sub(event);
		} catch (err) {
			console.error(`[research:pubsub] subscriber threw on ${event.type}:`, err);
		}
	}
}

/**
 * Subscribe to events for `researchResultId`. Returns an unsubscribe fn.
 * The channel is GC'd once the last subscriber leaves.
 */
export function subscribe(researchResultId: string, fn: Subscriber): () => void {
	let subs = channels.get(researchResultId);
	if (!subs) {
		subs = new Set();
		channels.set(researchResultId, subs);
	}
	subs.add(fn);

	return () => {
		const current = channels.get(researchResultId);
		if (!current) return;
		current.delete(fn);
		if (current.size === 0) channels.delete(researchResultId);
	};
}

/**
 * Drop a channel entirely. Called by the orchestrator wrapper after a
 * terminal event has been published, so any leftover subscribers (e.g. a
 * lingering SSE connection that hasn't ticked yet) get cleaned up.
 */
export function closeChannel(researchResultId: string): void {
	channels.delete(researchResultId);
}
