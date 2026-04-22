/**
 * Pending deep-research jobs — bookkeeping for the cross-tick state
 * machine in the mission planner.
 *
 * Lifecycle:
 *   tick N:   mission triggers deep research → submit via mana-research
 *             → insert row { taskId, providerId, submitted_at }
 *             → skip planner this tick (result not ready)
 *   tick N+k: row present → poll via mana-research
 *             → if still running: touch last_polled_at, skip planner
 *             → if completed: read result, DELETE row, feed planner
 *             → if failed: DELETE row (mission goes through normal
 *               shallow path next tick)
 *
 * Storage only tracks the pending phase. Finished results are consumed
 * immediately by the tick that sees them — no persistence beyond the
 * resulting iteration written back to sync_changes.
 */

import type { Sql } from './connection';

export interface PendingResearchJob {
	userId: string;
	missionId: string;
	taskId: string;
	providerId: string;
	submittedAt: Date;
	lastPolledAt: Date | null;
}

export async function getPendingResearchJob(
	sql: Sql,
	userId: string,
	missionId: string
): Promise<PendingResearchJob | null> {
	const rows = await sql<
		{
			user_id: string;
			mission_id: string;
			task_id: string;
			provider_id: string;
			submitted_at: Date;
			last_polled_at: Date | null;
		}[]
	>`
		SELECT user_id, mission_id, task_id, provider_id, submitted_at, last_polled_at
		FROM mana_ai.mission_research_jobs
		WHERE user_id = ${userId} AND mission_id = ${missionId}
		LIMIT 1
	`;
	if (rows.length === 0) return null;
	const r = rows[0];
	return {
		userId: r.user_id,
		missionId: r.mission_id,
		taskId: r.task_id,
		providerId: r.provider_id,
		submittedAt: r.submitted_at,
		lastPolledAt: r.last_polled_at,
	};
}

export async function insertPendingResearchJob(
	sql: Sql,
	userId: string,
	missionId: string,
	taskId: string,
	providerId: string
): Promise<void> {
	await sql`
		INSERT INTO mana_ai.mission_research_jobs
			(user_id, mission_id, task_id, provider_id)
		VALUES (${userId}, ${missionId}, ${taskId}, ${providerId})
		ON CONFLICT (user_id, mission_id) DO UPDATE SET
			task_id = EXCLUDED.task_id,
			provider_id = EXCLUDED.provider_id,
			submitted_at = now(),
			last_polled_at = NULL
	`;
}

export async function touchPendingResearchJob(
	sql: Sql,
	userId: string,
	missionId: string
): Promise<void> {
	await sql`
		UPDATE mana_ai.mission_research_jobs
		SET last_polled_at = now()
		WHERE user_id = ${userId} AND mission_id = ${missionId}
	`;
}

export async function deletePendingResearchJob(
	sql: Sql,
	userId: string,
	missionId: string
): Promise<void> {
	await sql`
		DELETE FROM mana_ai.mission_research_jobs
		WHERE user_id = ${userId} AND mission_id = ${missionId}
	`;
}
