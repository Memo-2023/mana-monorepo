/**
 * Workbench Timeline queries.
 *
 * Reactive slices over the persisted `_events` table, filtered to the AI
 * actor. The Workbench renders these chronologically so the user has a
 * single place to see "what did the AI do today, last week, for this
 * mission?" with rationale inline and a link back into each module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '../../database';
import type { DomainEvent } from '../../events/types';

const EVENTS_TABLE = '_events';

export interface AiTimelineOptions {
	/** Only events from this mission (matches `meta.actor.missionId`). */
	missionId?: string;
	/** Module filter — matches `meta.appId`. */
	module?: string;
	/** Max rows to return. Default 200, cap 1000. */
	limit?: number;
}

/** Live query — rerenders on every persisted event. */
export function useAiTimeline(options: AiTimelineOptions = {}) {
	const { missionId, module, limit = 200 } = options;
	return useLiveQueryWithDefault(async () => {
		const cap = Math.min(limit, 1000);
		const all = (await db
			.table(EVENTS_TABLE)
			.orderBy('meta.timestamp')
			.reverse()
			.limit(cap * 3) // over-fetch because we filter client-side
			.toArray()) as DomainEvent[];

		return all
			.filter((e) => e.meta.actor?.kind === 'ai')
			.filter((e) => (module ? e.meta.appId === module : true))
			.filter((e) => {
				if (!missionId) return true;
				const a = e.meta.actor;
				return a?.kind === 'ai' && a.missionId === missionId;
			})
			.slice(0, cap);
	}, [] as DomainEvent[]);
}

/**
 * Group timeline events into iteration buckets for prettier rendering.
 * Events share a bucket when their actor.iterationId matches.
 */
export interface TimelineBucket {
	key: string;
	missionId: string;
	iterationId: string;
	rationale: string;
	firstTimestamp: string;
	events: DomainEvent[];
	/** Owning Agent — cached off the first AI actor in the bucket. All
	 *  events in a bucket share the same (agentId, missionId, iterationId)
	 *  tuple so reading from the first is lossless. */
	agentId: string;
	agentDisplayName: string;
}

export function bucketByIteration(events: readonly DomainEvent[]): TimelineBucket[] {
	const buckets = new Map<string, TimelineBucket>();
	for (const e of events) {
		const a = e.meta.actor;
		if (a?.kind !== 'ai') continue;
		const key = `${a.missionId}::${a.iterationId}`;
		const existing = buckets.get(key);
		if (existing) {
			existing.events.push(e);
			if (e.meta.timestamp < existing.firstTimestamp) {
				existing.firstTimestamp = e.meta.timestamp;
			}
		} else {
			buckets.set(key, {
				key,
				missionId: a.missionId,
				iterationId: a.iterationId,
				rationale: a.rationale,
				firstTimestamp: e.meta.timestamp,
				events: [e],
				agentId: a.principalId,
				agentDisplayName: a.displayName,
			});
		}
	}
	return [...buckets.values()].sort((a, b) => (a.firstTimestamp < b.firstTimestamp ? 1 : -1));
}
