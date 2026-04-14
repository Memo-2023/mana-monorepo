/**
 * Revert an AI-produced iteration.
 *
 * Walks the `_events` log for every event attributed to the given
 * mission + iteration, looks up each event's inverse in the registry,
 * and applies it. Non-reversible events are tallied separately so the
 * caller can surface "X actions could not be auto-reverted; please
 * revert them manually" instead of silently skipping.
 *
 * Side-effect of running an inverse: a new "undo" event lands in the
 * log, attributed to the USER actor (via the default runAs scope).
 * That keeps the timeline honest — the AI did X, then the user did
 * not-X. No magic hiding.
 */

import { db } from '../../database';
import type { DomainEvent } from '../../events/types';
import { getInverseOperation } from './inverse-operations';

const EVENTS_TABLE = '_events';

export interface RevertStats {
	total: number;
	reverted: number;
	skippedUnsupported: number;
	failed: number;
	failures: { eventType: string; recordId: string; reason: string }[];
}

/**
 * Revert every event emitted under `actor.iterationId === iterationId`
 * (scoped to the given missionId). Called by the Workbench "Revert"
 * button on an iteration bucket.
 */
export async function revertIteration(
	missionId: string,
	iterationId: string
): Promise<RevertStats> {
	const allEvents = (await db.table(EVENTS_TABLE).toArray()) as DomainEvent[];
	const target = allEvents.filter((e) => {
		const a = e.meta.actor;
		return a?.kind === 'ai' && a.missionId === missionId && a.iterationId === iterationId;
	});

	const stats: RevertStats = {
		total: target.length,
		reverted: 0,
		skippedUnsupported: 0,
		failed: 0,
		failures: [],
	};

	// Process newest first — if a later event built on an earlier one
	// (e.g. TaskCompleted on a task that TaskCreated made), we must undo
	// the completion before deleting the task.
	target.sort((a, b) => (a.meta.timestamp < b.meta.timestamp ? 1 : -1));

	for (const event of target) {
		const inverse = getInverseOperation(event.type);
		if (!inverse) {
			stats.skippedUnsupported++;
			continue;
		}
		try {
			const result = await inverse(event.payload as Record<string, unknown>);
			if (result.ok) {
				stats.reverted++;
			} else {
				stats.failed++;
				stats.failures.push({
					eventType: event.type,
					recordId: event.meta.recordId,
					reason: result.reason,
				});
			}
		} catch (err) {
			stats.failed++;
			stats.failures.push({
				eventType: event.type,
				recordId: event.meta.recordId,
				reason: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return stats;
}
