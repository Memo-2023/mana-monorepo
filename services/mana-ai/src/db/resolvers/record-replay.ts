/**
 * Single-record LWW replay.
 *
 * `missions-projection.ts` replays the whole `aiMissions` set; resolvers
 * only need one record at a time. This helper is the focused version —
 * WHERE-filters on `app_id + table_name + record_id`, merges fields in
 * chronological order with per-field LWW, respects delete tombstones.
 *
 * Returns the merged record or `null` if the record was deleted or has
 * never been written.
 */

import type { Sql } from '../connection';
import { withUser } from '../connection';

interface ChangeRow {
	op: string;
	data: Record<string, unknown> | null;
	field_timestamps: Record<string, string> | null;
	created_at: Date;
}

export async function replayRecord(
	sql: Sql,
	userId: string,
	appId: string,
	tableName: string,
	recordId: string
): Promise<Record<string, unknown> | null> {
	return withUser(sql, userId, async (tx) => {
		const rows = await tx<ChangeRow[]>`
			SELECT op, data, field_timestamps, created_at
			FROM sync_changes
			WHERE user_id = ${userId}
				AND app_id = ${appId}
				AND table_name = ${tableName}
				AND record_id = ${recordId}
			ORDER BY created_at ASC
		`;
		if (rows.length === 0) return null;

		let record: Record<string, unknown> | null = null;
		let fieldTimestamps: Record<string, string> = {};

		for (const row of rows) {
			if (row.op === 'delete') {
				return null;
			}

			if (!record) {
				record = row.data ? { id: recordId, ...row.data } : { id: recordId };
				if (row.field_timestamps) {
					fieldTimestamps = { ...row.field_timestamps };
				}
				continue;
			}

			if (!row.data) continue;
			const rowFT = row.field_timestamps ?? {};
			for (const [k, v] of Object.entries(row.data)) {
				const serverTime = rowFT[k] ?? row.created_at.toISOString();
				const localTime = fieldTimestamps[k] ?? '';
				if (serverTime >= localTime) {
					record[k] = v;
					fieldTimestamps[k] = serverTime;
				}
			}
		}

		if (record && (record.deletedAt as string | undefined)) return null;
		return record;
	});
}
