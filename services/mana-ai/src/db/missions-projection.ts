/**
 * Missions projection — replays `sync_changes` rows for appId='ai',
 * table='aiMissions' into live Mission records using field-level LWW.
 *
 * This mirrors what the webapp's `applyServerChanges` does in Dexie but
 * runs against Postgres. Kept deliberately dumb: no caching, no
 * incremental updates, full replay on every tick. Missions per user are
 * bounded (~dozens at most) so O(N) replay is fine for a once-a-minute
 * scheduler. Revisit when users hit >1000 missions or the tick misses
 * its deadline.
 */

import type { Sql } from './connection';

/**
 * Subset of the Mission shape the server needs. Matches
 * `apps/mana/apps/web/src/lib/data/ai/missions/types.ts` — keep in sync.
 */
export interface ServerMission {
	id: string;
	userId: string;
	title: string;
	objective: string;
	conceptMarkdown: string;
	state: 'active' | 'paused' | 'done' | 'archived';
	nextRunAt: string | undefined;
	inputs: { module: string; table: string; id: string }[];
	cadence: unknown; // opaque — the browser Runner owns cadence math
	iterations: unknown[]; // opaque — server just reads count
}

interface ChangeRow {
	table_name: string;
	record_id: string;
	user_id: string;
	op: string;
	data: Record<string, unknown> | null;
	field_timestamps: Record<string, string> | null;
	created_at: Date;
}

/**
 * Return all currently-active missions whose `nextRunAt` has passed.
 * Server-side equivalent of `listMissions({ dueBefore: now })` in the
 * webapp store.
 *
 * @param now ISO timestamp used as the due-before cutoff.
 */
export async function listDueMissions(sql: Sql, now: string): Promise<ServerMission[]> {
	// Pull every event for the ai app across users. For a real deploy
	// we'd scope per-user or shard; the pre-launch user count makes this
	// single scan defensible.
	const rows = await sql<ChangeRow[]>`
		SELECT table_name, record_id, user_id, op, data, field_timestamps, created_at
		FROM sync_changes
		WHERE app_id = 'ai' AND table_name = 'aiMissions'
		ORDER BY created_at ASC
	`;

	// Replay per record. Map key: userId::recordId (user isolation is kept
	// even though we fetched across users in one scan — the result goes
	// back to whichever user owns each row).
	const merged = new Map<string, { userId: string; record: Record<string, unknown> }>();

	for (const row of rows) {
		const key = `${row.user_id}::${row.record_id}`;
		const entry = merged.get(key);

		if (row.op === 'delete') {
			merged.delete(key);
			continue;
		}

		if (!entry) {
			if (row.data) {
				merged.set(key, { userId: row.user_id, record: { id: row.record_id, ...row.data } });
			}
			continue;
		}

		// Field-level LWW: newer timestamps overwrite.
		const prevFT = (entry.record.__fieldTimestamps as Record<string, string> | undefined) ?? {};
		const nextFT = { ...prevFT };
		if (row.data) {
			for (const [k, v] of Object.entries(row.data)) {
				const serverTime = row.field_timestamps?.[k] ?? row.created_at.toISOString();
				const localTime = prevFT[k] ?? '';
				if (serverTime >= localTime) {
					entry.record[k] = v;
					nextFT[k] = serverTime;
				}
			}
		}
		entry.record.__fieldTimestamps = nextFT;
	}

	const missions: ServerMission[] = [];
	for (const { userId, record } of merged.values()) {
		const state = record.state as ServerMission['state'];
		const nextRunAt = record.nextRunAt as string | undefined;
		const deletedAt = record.deletedAt as string | undefined;
		if (deletedAt) continue;
		if (state !== 'active') continue;
		if (!nextRunAt || nextRunAt > now) continue;

		missions.push({
			id: String(record.id),
			userId,
			title: String(record.title ?? ''),
			objective: String(record.objective ?? ''),
			conceptMarkdown: String(record.conceptMarkdown ?? ''),
			state,
			nextRunAt,
			inputs: Array.isArray(record.inputs) ? (record.inputs as ServerMission['inputs']) : [],
			cadence: record.cadence,
			iterations: Array.isArray(record.iterations) ? record.iterations : [],
		});
	}
	return missions;
}
