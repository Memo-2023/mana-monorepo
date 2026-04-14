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
import { withUser } from './connection';

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
 * Return the distinct user_ids that have ever written an aiMissions row.
 *
 * This is the ONE query that needs to see across users. It runs WITHOUT
 * `withUser`, so the DB role hosting mana-ai either:
 *   - has BYPASSRLS (simplest — ops choice), or
 *   - owns sync_changes and the FORCE RLS policy excludes owner (default
 *     Postgres semantics; requires dropping `FORCE ROW LEVEL SECURITY`)
 *
 * The per-user read paths below scope through RLS normally, so a leaky
 * user_ids discovery is the only cross-user surface this service exposes.
 */
export async function listMissionUsers(sql: Sql): Promise<string[]> {
	const rows = await sql<{ user_id: string }[]>`
		SELECT DISTINCT user_id
		FROM sync_changes
		WHERE app_id = 'ai' AND table_name = 'aiMissions'
	`;
	return rows.map((r) => r.user_id);
}

/**
 * Return active missions for a single user whose `nextRunAt` has passed.
 * RLS-scoped via `withUser` — defense-in-depth against a query wandering
 * outside its user.
 */
async function listDueMissionsForUser(
	sql: Sql,
	userId: string,
	now: string
): Promise<ServerMission[]> {
	const rows = await withUser(
		sql,
		userId,
		async (tx) =>
			tx<ChangeRow[]>`
			SELECT table_name, record_id, user_id, op, data, field_timestamps, created_at
			FROM sync_changes
			WHERE app_id = 'ai' AND table_name = 'aiMissions' AND user_id = ${userId}
			ORDER BY created_at ASC
		`
	);
	return mergeAndFilter(rows as ChangeRow[], userId, now);
}

/**
 * Return all currently-active missions whose `nextRunAt` has passed,
 * across every user. Two-phase: discover users (cross-user), then
 * RLS-scope per user.
 *
 * @param now ISO timestamp used as the due-before cutoff.
 */
export async function listDueMissions(sql: Sql, now: string): Promise<ServerMission[]> {
	const users = await listMissionUsers(sql);
	const perUser = await Promise.all(users.map((u) => listDueMissionsForUser(sql, u, now)));
	return perUser.flat();
}

/**
 * Merge `sync_changes` rows for ONE user's aiMissions set via field-level
 * LWW, then filter down to due + active records.
 *
 * Pure function — no DB access, no ambient state. Exported for tests.
 */
export function mergeAndFilter(
	rows: readonly ChangeRow[],
	userId: string,
	now: string
): ServerMission[] {
	const merged = new Map<string, Record<string, unknown>>();

	for (const row of rows) {
		const existing = merged.get(row.record_id);

		if (row.op === 'delete') {
			merged.delete(row.record_id);
			continue;
		}

		if (!existing) {
			if (row.data) {
				merged.set(row.record_id, { id: row.record_id, ...row.data });
			}
			continue;
		}

		const prevFT = (existing.__fieldTimestamps as Record<string, string> | undefined) ?? {};
		const nextFT = { ...prevFT };
		if (row.data) {
			for (const [k, v] of Object.entries(row.data)) {
				const serverTime = row.field_timestamps?.[k] ?? row.created_at.toISOString();
				const localTime = prevFT[k] ?? '';
				if (serverTime >= localTime) {
					existing[k] = v;
					nextFT[k] = serverTime;
				}
			}
		}
		existing.__fieldTimestamps = nextFT;
	}

	const missions: ServerMission[] = [];
	for (const record of merged.values()) {
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
