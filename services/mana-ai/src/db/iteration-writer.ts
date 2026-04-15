/**
 * Append a server-produced iteration to an existing Mission by inserting
 * a `sync_changes` row of op='update' carrying the new `iterations`
 * array in `fields`. The row is attributed to the mission-runner system
 * actor so the Workbench timeline on the user's device distinguishes it
 * from their own edits.
 *
 * The write is RLS-scoped via `withUser` so a compromised DB role can't
 * leak the iteration across users even if the row's user_id column were
 * wrong. The caller is responsible for passing the correct userId (from
 * the mission projection).
 *
 * The webapp picks up this row on next sync, `applyServerChanges` merges
 * the updated `iterations` array into the local Mission record, and the
 * staging-effect translates each PlanStep into a local Proposal.
 */

import type { Sql } from './connection';
import { withUser } from './connection';
import {
	makeAgentActor,
	makeSystemActor,
	SYSTEM_MISSION_RUNNER,
	LEGACY_AI_PRINCIPAL,
	type Actor,
} from '@mana/shared-ai';
import type { AiPlanOutput, MissionIteration, PlanStep } from '@mana/shared-ai';

export interface AppendIterationInput {
	userId: string;
	missionId: string;
	/** Full `iterations` array AFTER appending the new entry.
	 *  Caller reads the current mission, appends, passes the full array
	 *  — matches the webapp's `finishIteration` shape. */
	allIterations: readonly MissionIteration[];
	/** The iteration just appended — its `id` is also embedded in every
	 *  PlanStep's intent so the webapp staging-effect can build
	 *  `iteration-scoped` Proposals. */
	newIteration: MissionIteration;
	/** When the write happened — used as the per-field updatedAt stamp
	 *  and the sync_changes.created_at fallback. */
	nowIso: string;
	/** Owning Agent context. When provided, the iteration row is
	 *  attributed to an `ai` actor with the agent's principalId + name;
	 *  the Workbench timeline on the webapp then groups this writer's
	 *  output under the right agent. When absent, falls back to the
	 *  legacy system-actor (Phase 1 shape) so pre-Phase-3 missions
	 *  still work. */
	agent?: {
		id: string;
		name: string;
	};
	/** Iteration id — required when `agent` is set, passed through to
	 *  the Actor so the revert path can group this write by iteration. */
	iterationId?: string;
	/** Rationale for the Actor — defaults to the iteration summary or
	 *  the mission objective. */
	rationale?: string;
}

/** Build the actor blob stamped on the sync_changes row. When the
 *  mission has an owning agent we attribute the write to that agent;
 *  otherwise we fall back to the mission-runner system actor so legacy
 *  missions (no agentId yet) still produce a valid Actor shape. */
function buildActor(input: AppendIterationInput): Actor {
	if (input.agent && input.iterationId) {
		return makeAgentActor({
			agentId: input.agent.id,
			displayName: input.agent.name,
			missionId: input.missionId,
			iterationId: input.iterationId,
			rationale: input.rationale ?? '',
		});
	}
	// Legacy path — no agent context. Still identity-aware via the
	// system principal, just without agent grouping.
	if (input.iterationId) {
		return makeAgentActor({
			agentId: LEGACY_AI_PRINCIPAL,
			displayName: 'Mana',
			missionId: input.missionId,
			iterationId: input.iterationId,
			rationale: input.rationale ?? '',
		});
	}
	return makeSystemActor(SYSTEM_MISSION_RUNNER);
}

export async function appendServerIteration(sql: Sql, input: AppendIterationInput): Promise<void> {
	const { userId, missionId, allIterations, nowIso } = input;
	const fieldsPayload = {
		iterations: { value: allIterations, updatedAt: nowIso },
		updatedAt: { value: nowIso, updatedAt: nowIso },
	};
	const fieldTimestamps = {
		iterations: nowIso,
		updatedAt: nowIso,
	};
	// The mana-sync Go handler stores `data` on inserts and `fields` on
	// updates — for our update we populate the `data` JSONB with the
	// winning values and `field_timestamps` with the per-field stamps.
	const data = {
		iterations: allIterations,
		updatedAt: nowIso,
	};

	// postgres.js's `tx.json()` types are strict about JSONValue; our
	// structured MissionIteration[] has readonly fields that confuse the
	// inferred type. Cast at the boundary — the JSON serialization still
	// happens correctly at runtime.
	const dataJson = data as unknown;
	const ftJson = fieldTimestamps as unknown;
	const actorJson = buildActor(input) as unknown;

	await withUser(sql, userId, async (tx) => {
		await tx`
			INSERT INTO sync_changes
				(app_id, table_name, record_id, user_id, op, data, field_timestamps, client_id, schema_version, actor)
			VALUES
				('ai', 'aiMissions', ${missionId}, ${userId}, 'update',
				 ${tx.json(dataJson as never)}, ${tx.json(ftJson as never)},
				 'mana-ai-runner', 1, ${tx.json(actorJson as never)})
		`;
	});

	// fieldsPayload is kept as a named local so a future refactor that
	// needs to emit a `fields`-shaped payload (if mana-sync ever rejects
	// `data` for updates) has a ready-made map to send. Current contract
	// accepts either.
	void fieldsPayload;
}

/** Convert an {@link AiPlanOutput} from the shared parser into the
 *  inline-stored MissionIteration shape. */
export function planToIteration(
	plan: AiPlanOutput,
	iterationId: string,
	nowIso: string
): MissionIteration {
	const steps: PlanStep[] = plan.steps.map((ps, i) => ({
		id: `${iterationId}-${i}`,
		summary: ps.summary,
		intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
		status: 'planned',
	}));
	return {
		id: iterationId,
		startedAt: nowIso,
		finishedAt: nowIso,
		plan: steps,
		summary: plan.summary,
		overallStatus: plan.steps.length === 0 ? 'approved' : 'awaiting-review',
		source: 'server',
	};
}
