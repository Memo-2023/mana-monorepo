/**
 * Server-iteration executor — applies server-planned iterations on the
 * user's device.
 *
 * mana-ai produces iterations with source='server' and plan[] entries
 * at status='planned'. The server can't touch Dexie, so those steps
 * have to execute on the client when sync delivers them. This module
 * subscribes to the Mission table, picks up newly arrived server
 * iterations, runs each tool_call through the local executor under
 * the AI actor, and flips the status in place (planned → approved /
 * failed). A Dexie marker table gives us idempotency so a sync replay
 * or a page reload doesn't re-run anything.
 *
 * Writes go to Dexie directly rather than through store mutations —
 * we need to update an iteration embedded in the Mission's iterations
 * array, which the store API doesn't expose yet.
 */

import { liveQuery, type Observable, type Subscription } from 'dexie';
import { db } from '../../database';
import { executeTool } from '../../tools/executor';
import { getAgent } from '../agents/store';
import { makeAgentActor, LEGACY_AI_PRINCIPAL } from '../../events/actor';
import { DEFAULT_AGENT_NAME } from '../agents/types';
import { MISSIONS_TABLE } from './types';
import type { Mission, MissionIteration, PlanStep } from './types';

/** Local-only Dexie table — tracks iterations we've already run so a
 *  sync replay doesn't re-execute their tool_calls. */
const MARKER_TABLE = '_serverIterationExecutions';

interface ExecutionMarker {
	iterationId: string;
	missionId: string;
	executedAt: string;
	overallStatus: 'approved' | 'failed';
}

let subscription: Subscription | null = null;
/** Per-iteration lock so concurrent subscription ticks don't both
 *  try to execute the same iteration. liveQuery can fire rapidly
 *  on Dexie writes (including ours, during tool execution). */
const inFlight = new Set<string>();

export function startServerIterationExecutor(): void {
	if (subscription) return;

	const stream: Observable<Array<{ mission: Mission; iteration: MissionIteration }>> = liveQuery(
		async () => {
			const missions = await db.table<Mission>(MISSIONS_TABLE).toArray();
			const work: Array<{ mission: Mission; iteration: MissionIteration }> = [];
			for (const m of missions) {
				for (const it of m.iterations) {
					if (it.source !== 'server') continue;
					if (!it.plan.some((s) => s.status === 'planned')) continue;
					work.push({ mission: m, iteration: it });
				}
			}
			return work;
		}
	);

	subscription = stream.subscribe({
		next: async (work) => {
			for (const entry of work) {
				if (inFlight.has(entry.iteration.id)) continue;
				const already = await db.table<ExecutionMarker>(MARKER_TABLE).get(entry.iteration.id);
				if (already) continue;
				inFlight.add(entry.iteration.id);
				try {
					await executeServerIteration(entry.mission, entry.iteration);
				} catch (err) {
					console.error(
						`[ServerIterationExecutor] mission=${entry.mission.id} iter=${entry.iteration.id} failed:`,
						err
					);
				} finally {
					inFlight.delete(entry.iteration.id);
				}
			}
		},
		error: (err) => console.error('[ServerIterationExecutor] stream error:', err),
	});
}

export function stopServerIterationExecutor(): void {
	subscription?.unsubscribe();
	subscription = null;
	inFlight.clear();
}

/** Internal: run one iteration's planned steps, then rewrite the
 *  Mission record with updated step status + overallStatus. */
async function executeServerIteration(
	mission: Mission,
	iteration: MissionIteration
): Promise<void> {
	const owningAgent = mission.agentId ? await getAgent(mission.agentId) : null;
	const aiActor = makeAgentActor({
		agentId: owningAgent?.id ?? LEGACY_AI_PRINCIPAL,
		displayName: owningAgent?.name ?? DEFAULT_AGENT_NAME,
		missionId: mission.id,
		iterationId: iteration.id,
		rationale: mission.objective,
	});

	const nextSteps: PlanStep[] = [];
	let failed = 0;

	for (const step of iteration.plan) {
		if (step.status !== 'planned') {
			nextSteps.push(step);
			continue;
		}
		if (step.intent.kind !== 'toolCall') {
			nextSteps.push({ ...step, status: 'skipped' });
			continue;
		}
		try {
			const result = await executeTool(step.intent.toolName, step.intent.params, aiActor);
			nextSteps.push({
				...step,
				status: result.success ? 'approved' : 'failed',
				summary: result.success ? step.summary : `${step.summary} (FEHLER: ${result.message})`,
			});
			if (!result.success) failed++;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			nextSteps.push({ ...step, status: 'failed', summary: `${step.summary} (FEHLER: ${msg})` });
			failed++;
		}
	}

	const overallStatus: MissionIteration['overallStatus'] =
		nextSteps.length === 0 ? 'approved' : failed === nextSteps.length ? 'failed' : 'approved';

	// Write the updated iteration back into the Mission record.
	// Dexie's modify() passes a mutable view; the Mission type marks
	// iterations as readonly at the TS level for observer callers —
	// cast is scoped to this mutation.
	await db
		.table<Mission>(MISSIONS_TABLE)
		.where('id')
		.equals(mission.id)
		.modify((m) => {
			const iterations = m.iterations as MissionIteration[];
			const idx = iterations.findIndex((it) => it.id === iteration.id);
			if (idx < 0) return;
			iterations[idx] = { ...iteration, plan: nextSteps, overallStatus };
		});

	await db.table<ExecutionMarker>(MARKER_TABLE).put({
		iterationId: iteration.id,
		missionId: mission.id,
		executedAt: new Date().toISOString(),
		overallStatus,
	});
}
