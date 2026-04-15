/**
 * Read side of `mana_ai.decrypt_audit`. Returns rows for one user +
 * (optionally) one mission, newest first.
 *
 * RLS-scoped via `withUser` — even if the caller forgets the WHERE
 * clause, the policy wouldn't expose another user's rows. The explicit
 * `user_id = $1` clause is belt + braces.
 */

import type { Sql } from './connection';
import { withUser } from './connection';

export interface DecryptAuditRow {
	id: string;
	missionId: string;
	iterationId: string | null;
	tableName: string;
	recordId: string;
	status: 'ok' | 'failed' | 'scope-violation';
	reason: string | null;
	ts: string;
}

export interface ReadDecryptAuditParams {
	missionId?: string;
	/** Caller-controlled upper bound. Hard-capped at 1000 so a runaway
	 *  client can't OOM us. */
	limit?: number;
}

export async function readDecryptAudit(
	sql: Sql,
	userId: string,
	params: ReadDecryptAuditParams = {}
): Promise<DecryptAuditRow[]> {
	const limit = Math.max(1, Math.min(1000, params.limit ?? 200));

	return withUser(sql, userId, async (tx) => {
		const rows = params.missionId
			? await tx<AuditRowRaw[]>`
				SELECT id, mission_id, iteration_id, table_name, record_id, status, reason, ts
				FROM mana_ai.decrypt_audit
				WHERE user_id = ${userId} AND mission_id = ${params.missionId}
				ORDER BY ts DESC
				LIMIT ${limit}
			`
			: await tx<AuditRowRaw[]>`
				SELECT id, mission_id, iteration_id, table_name, record_id, status, reason, ts
				FROM mana_ai.decrypt_audit
				WHERE user_id = ${userId}
				ORDER BY ts DESC
				LIMIT ${limit}
			`;

		return rows.map((r) => ({
			id: String(r.id),
			missionId: r.mission_id,
			iterationId: r.iteration_id,
			tableName: r.table_name,
			recordId: r.record_id,
			status: r.status as DecryptAuditRow['status'],
			reason: r.reason,
			ts: r.ts instanceof Date ? r.ts.toISOString() : String(r.ts),
		}));
	});
}

interface AuditRowRaw {
	id: number | string;
	mission_id: string;
	iteration_id: string | null;
	table_name: string;
	record_id: string;
	status: string;
	reason: string | null;
	ts: Date | string;
}
