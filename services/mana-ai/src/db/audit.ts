/**
 * Decrypt-audit writer — appends one row per server-side decrypt attempt
 * to `mana_ai.decrypt_audit`.
 *
 * Invariants:
 *   - **Append-only.** Never mutate or delete. Expire old rows via a
 *     separate retention job if at all.
 *   - **Write before decrypt**, not after. If the decrypt itself throws,
 *     we still want the attempt on record so forensics can tell
 *     "mana-ai tried to read record X". The writer is called with the
 *     *outcome* though — pattern is: try decrypt; in success/failure
 *     branch, call `writeDecryptAudit` with the right status. On an
 *     unexpected throw (network, DB), the audit row is lost — acceptable
 *     because the decrypt didn't complete either.
 *   - **Best-effort.** A write failure is logged but never escalates; we
 *     must not break Mission ticks because the audit table is unhappy.
 *
 * Row volume: with ~50 active Missions × 5 inputs × 1 tick/minute, worst
 * case is ~360k rows/day. Fine for Postgres but suggests a retention job
 * at ~90 days.
 */

import type { Sql } from './connection';
import { withUser } from './connection';

export type DecryptAuditStatus = 'ok' | 'failed' | 'scope-violation';

export interface DecryptAuditEntry {
	missionId: string;
	iterationId?: string;
	tableName: string;
	recordId: string;
	status: DecryptAuditStatus;
	/** Short machine-readable reason on non-ok rows: `wrap-rejected`,
	 *  `ciphertext-tampered`, `scope-record-not-allowlisted`, etc. */
	reason?: string;
}

export async function writeDecryptAudit(
	sql: Sql,
	userId: string,
	entry: DecryptAuditEntry
): Promise<void> {
	try {
		await withUser(sql, userId, async (tx) => {
			await tx`
				INSERT INTO mana_ai.decrypt_audit (
					user_id, mission_id, iteration_id, table_name, record_id, status, reason
				) VALUES (
					${userId},
					${entry.missionId},
					${entry.iterationId ?? null},
					${entry.tableName},
					${entry.recordId},
					${entry.status},
					${entry.reason ?? null}
				)
			`;
		});
	} catch (err) {
		// Audit failures must never cascade into tick failures. Log loud
		// enough that an operator notices and can investigate.
		console.error(
			'[mana-ai audit] failed to write decrypt_audit row:',
			err instanceof Error ? err.message : String(err),
			entry
		);
	}
}
