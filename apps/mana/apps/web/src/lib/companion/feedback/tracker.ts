/**
 * Feedback Tracker — Records nudge outcomes to IndexedDB.
 *
 * Used by the nudge UI to track whether users act on, dismiss,
 * or ignore nudges. Over time, patterns emerge that can adjust
 * rule timing and priority.
 */

import { db } from '$lib/data/database';
import type { NudgeType } from '../rules/types';
import type { NudgeOutcome } from './types';

const TABLE = '_nudgeOutcomes';

export async function recordOutcome(
	nudgeId: string,
	nudgeType: NudgeType,
	outcome: NudgeOutcome['outcome'],
	latencyMs?: number
): Promise<void> {
	await db.table(TABLE).add({
		nudgeId,
		nudgeType,
		outcome,
		latencyMs,
		timestamp: new Date().toISOString(),
	});
}

/** Get outcome stats for a nudge type (last 30 days). */
export async function getOutcomeStats(
	nudgeType: NudgeType
): Promise<{ acted: number; dismissed: number; snoozed: number; expired: number; total: number }> {
	const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
	const rows: NudgeOutcome[] = await db
		.table(TABLE)
		.where('[nudgeType+outcome]')
		.between([nudgeType, ''], [nudgeType, '\uffff'])
		.filter((r: NudgeOutcome) => r.timestamp >= cutoff)
		.toArray();

	const stats = { acted: 0, dismissed: 0, snoozed: 0, expired: 0, total: rows.length };
	for (const r of rows) {
		if (r.outcome in stats) stats[r.outcome as keyof typeof stats]++;
	}
	return stats;
}

/** Action rate for a nudge type (0-1). Returns null if insufficient data. */
export async function getActionRate(nudgeType: NudgeType): Promise<number | null> {
	const stats = await getOutcomeStats(nudgeType);
	if (stats.total < 5) return null;
	return stats.acted / stats.total;
}
