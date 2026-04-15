/**
 * MissionRunner — executes one iteration of a Mission.
 *
 *   load mission
 *     ↓
 *   resolve inputs via registered resolvers
 *     ↓
 *   build available-tool list (policy-filtered)
 *     ↓
 *   call planner (LLM) → AiPlanOutput
 *     ↓
 *   for each step: stage a Proposal under the AI actor
 *     ↓
 *   finishIteration(summary, overallStatus, plan-with-proposal-ids)
 *
 * Planner + proposal-staging are injected so the Runner is unit-testable
 * without a live LLM or Dexie hooks. Default implementations call the
 * shared LlmOrchestrator / `executeTool(...)` respectively; production
 * code passes those in via the setup module.
 */

import {
	getMission,
	startIteration,
	finishIteration,
	setIterationPhase,
	isCancelRequested,
} from './store';
import { resolveMissionInputs } from './input-resolvers';
import { getAvailableToolsForAi } from './available-tools';
import { executeTool } from '../../tools/executor';
import type { Actor } from '../../events/actor';
import type { Mission, MissionIteration, PlanStep } from './types';
import type { AiPlanInput, AiPlanOutput, PlannedStep } from './planner/types';

/** Hard timeout for one mission run. Cancels the in-flight planner call
 *  and finalises the iteration as failed. 90 s is comfortable for a
 *  cloud-tier model but short enough that a wedged backend doesn't sit
 *  in `running` indefinitely. */
const ITERATION_TIMEOUT_MS = 90_000;

class CancelledError extends Error {
	constructor(reason: string) {
		super(reason);
		this.name = 'CancelledError';
	}
}

export interface MissionRunnerDeps {
	/** Invoke the Planner LLM task with the fully-built input. */
	plan: (input: AiPlanInput) => Promise<AiPlanOutput>;
	/** Stage a single planned step as a Proposal. Returns the proposal id on success. */
	stageStep?: (step: PlannedStep, aiActor: Extract<Actor, { kind: 'ai' }>) => Promise<StageOutcome>;
}

export type StageOutcome =
	| { readonly ok: true; readonly proposalId: string }
	| { readonly ok: false; readonly error: string };

/** Default step-staging implementation: policy-gated executor under AI actor. */
export const defaultStageStep: Required<MissionRunnerDeps>['stageStep'] = async (step, aiActor) => {
	const stepActor: Extract<Actor, { kind: 'ai' }> = {
		...aiActor,
		// Per-step rationale wins over the mission-wide one so the review UI
		// shows *this step's* reasoning.
		rationale: step.rationale || aiActor.rationale,
	};
	const result = await executeTool(step.toolName, step.params, stepActor);
	if (!result.success) {
		return { ok: false, error: result.message };
	}
	const data = result.data as { proposalId?: string } | undefined;
	if (data?.proposalId) return { ok: true, proposalId: data.proposalId };
	// Policy resolved to 'auto' — no proposal row was created, the tool
	// ran directly. Treat as ok but without a proposal id to thread back.
	return { ok: true, proposalId: '' };
};

export interface RunMissionResult {
	readonly iteration: MissionIteration;
	readonly plannedSteps: number;
	readonly stagedSteps: number;
	readonly failedSteps: number;
}

/** Run one iteration of the given mission. */
export async function runMission(
	missionId: string,
	deps: MissionRunnerDeps
): Promise<RunMissionResult> {
	const mission = await getMission(missionId);
	if (!mission) throw new Error(`Mission not found: ${missionId}`);
	if (mission.state !== 'active') {
		throw new Error(`Mission ${missionId} is ${mission.state}, cannot run`);
	}

	// Start the iteration with an empty plan so it's visible in the UI as "running".
	// Use the id the store generates so finishIteration updates the same row.
	const startedIteration = await startIteration(mission.id, { plan: [] });
	const iterationId = startedIteration.id;
	const aiActor: Extract<Actor, { kind: 'ai' }> = {
		kind: 'ai',
		missionId: mission.id,
		iterationId,
		rationale: mission.objective,
	};

	// Hard timeout: any phase taking longer than ITERATION_TIMEOUT_MS aborts
	// the run. Wraps the whole pipeline in a Promise.race against a timer.
	const timeoutPromise = new Promise<never>((_, reject) =>
		setTimeout(
			() => reject(new CancelledError(`timeout after ${ITERATION_TIMEOUT_MS / 1000}s`)),
			ITERATION_TIMEOUT_MS
		)
	);

	async function checkCancel(): Promise<void> {
		if (await isCancelRequested(mission!.id, iterationId)) {
			throw new CancelledError('cancelled by user');
		}
	}

	async function runPipeline(): Promise<{
		recordedSteps: PlanStep[];
		stagedCount: number;
		failedCount: number;
		planSummary: string;
		planStepCount: number;
	}> {
		// ── Phase: resolving-inputs ────────────────────────────
		await setIterationPhase(
			mission!.id,
			iterationId,
			'resolving-inputs',
			mission!.inputs.length > 0 ? `${mission!.inputs.length} Input(s)` : 'keine Inputs'
		);
		const resolvedInputs = await resolveMissionInputs(mission!.inputs);
		const availableTools = getAvailableToolsForAi(aiActor);
		await checkCancel();

		// ── Phase: calling-llm ─────────────────────────────────
		await setIterationPhase(mission!.id, iterationId, 'calling-llm', 'frage Planner an');
		const plan = await deps.plan({ mission: mission!, resolvedInputs, availableTools });
		await checkCancel();

		// ── Phase: parsing-response ────────────────────────────
		await setIterationPhase(
			mission!.id,
			iterationId,
			'parsing-response',
			`${plan.steps.length} Step(s) erhalten`
		);
		await checkCancel();

		// ── Phase: staging-proposals ───────────────────────────
		const stage = deps.stageStep ?? defaultStageStep;
		const recordedSteps: PlanStep[] = [];
		let stagedCount = 0;
		let failedCount = 0;

		for (const [i, ps] of plan.steps.entries()) {
			await setIterationPhase(
				mission!.id,
				iterationId,
				'staging-proposals',
				`Step ${i + 1} von ${plan.steps.length}`
			);
			await checkCancel();

			const outcome = await stage(ps, aiActor);
			if (outcome.ok) {
				stagedCount++;
				recordedSteps.push({
					id: `${iterationId}-${i}`,
					summary: ps.summary,
					intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
					proposalId: outcome.proposalId || undefined,
					status: outcome.proposalId ? 'staged' : 'approved',
				});
			} else {
				failedCount++;
				recordedSteps.push({
					id: `${iterationId}-${i}`,
					summary: ps.summary,
					intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
					status: 'failed',
				});
			}
		}

		await setIterationPhase(mission!.id, iterationId, 'finalizing');
		return {
			recordedSteps,
			stagedCount,
			failedCount,
			planSummary: plan.summary,
			planStepCount: plan.steps.length,
		};
	}

	let recordedSteps: PlanStep[] = [];
	let stagedCount = 0;
	let failedCount = 0;
	let planSummary = '';
	let planStepCount = 0;
	try {
		const result = await Promise.race([runPipeline(), timeoutPromise]);
		recordedSteps = result.recordedSteps;
		stagedCount = result.stagedCount;
		failedCount = result.failedCount;
		planSummary = result.planSummary;
		planStepCount = result.planStepCount;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const isCancellation = err instanceof CancelledError;
		await finishIteration(mission.id, iterationId, {
			summary: isCancellation ? msg : `Planner failed: ${msg}`,
			overallStatus: 'failed',
		});
		return emptyResult(mission, iterationId, 'failed', msg);
	}

	const overallStatus: MissionIteration['overallStatus'] =
		planStepCount === 0
			? 'approved' // nothing to do is a valid outcome
			: failedCount === planStepCount
				? 'failed'
				: stagedCount > 0
					? 'awaiting-review'
					: 'approved';

	await finishIteration(mission.id, iterationId, {
		summary: planSummary,
		overallStatus,
		plan: recordedSteps,
	});

	return {
		iteration: {
			id: iterationId,
			startedAt: new Date().toISOString(),
			plan: recordedSteps,
			summary: planSummary,
			overallStatus,
		},
		plannedSteps: planStepCount,
		stagedSteps: stagedCount,
		failedSteps: failedCount,
	};
}

function emptyResult(
	_mission: Mission,
	iterationId: string,
	status: MissionIteration['overallStatus'],
	summary: string
): RunMissionResult {
	return {
		iteration: {
			id: iterationId,
			startedAt: new Date().toISOString(),
			plan: [],
			summary,
			overallStatus: status,
		},
		plannedSteps: 0,
		stagedSteps: 0,
		failedSteps: 0,
	};
}

/**
 * Scan all active missions whose `nextRunAt` has passed and run them once
 * each. Used by the foreground tick that wires this into `+layout.svelte`.
 * Safe to call concurrently — each mission run is independent.
 */
export async function runDueMissions(
	now: Date,
	deps: MissionRunnerDeps
): Promise<RunMissionResult[]> {
	const { listMissions } = await import('./store');
	const due = await listMissions({ dueBefore: now.toISOString() });
	const results: RunMissionResult[] = [];
	for (const m of due) {
		try {
			results.push(await runMission(m.id, deps));
		} catch (err) {
			console.error(`[MissionRunner] mission ${m.id} run threw:`, err);
		}
	}
	return results;
}
