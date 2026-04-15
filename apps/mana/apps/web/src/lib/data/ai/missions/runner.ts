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
import { db } from '../../database';
import { decryptRecords } from '../../crypto';
import { researchApi } from '$lib/api/research';
import { isAiDebugEnabled, recordAiDebug, type AiDebugEntry } from './debug';
import { makeAgentActor, LEGACY_AI_PRINCIPAL, type Actor } from '../../events/actor';
import { getAgent } from '../agents/store';
import { DEFAULT_AGENT_NAME } from '../agents/types';
import type { Mission, MissionIteration, PlanStep } from './types';
import type { AiPlanInput, AiPlanOutput, PlannedStep, ResolvedInput } from './planner/types';

/** Heuristic: mission objective text that should trigger a pre-step
 *  web-research call. Keeps the trigger explicit so unrelated missions
 *  don't burn credits accidentally. */
const RESEARCH_TRIGGER = /\b(recherchier|research|news|finde|suche|aktuelle|neueste)/i;
/** Singleton row id of the kontext doc — kept in sync with
 *  `modules/kontext/types.ts` (KONTEXT_SINGLETON_ID). */
const KONTEXT_SINGLETON_ID = 'singleton';

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

	// Resolve the owning agent. Missions that pre-date the Multi-Agent
	// rollout or whose agent was deleted fall back to the legacy
	// principal + default name — runner still attributes cleanly, UI
	// renders the work as "Mana".
	const owningAgent = mission.agentId ? await getAgent(mission.agentId) : null;
	const aiActor = makeAgentActor({
		agentId: owningAgent?.id ?? LEGACY_AI_PRINCIPAL,
		displayName: owningAgent?.name ?? DEFAULT_AGENT_NAME,
		missionId: mission.id,
		iterationId,
		rationale: mission.objective,
	});

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

	// Track the phase that was last active — so a catch handler can
	// attribute the error ("calling-llm" vs "parsing-response" is
	// enough context for most debugging without a stack trace).
	let lastPhase: import('@mana/shared-ai').IterationPhase | undefined;
	async function enterPhase(
		phase: import('@mana/shared-ai').IterationPhase,
		detail?: string
	): Promise<void> {
		lastPhase = phase;
		await setIterationPhase(mission!.id, iterationId, phase, detail);
	}

	async function runPipeline(): Promise<{
		recordedSteps: PlanStep[];
		stagedCount: number;
		failedCount: number;
		planSummary: string;
		planStepCount: number;
	}> {
		// ── Phase: resolving-inputs ────────────────────────────
		await enterPhase(
			'resolving-inputs',
			mission!.inputs.length > 0 ? `${mission!.inputs.length} Input(s)` : 'keine Inputs'
		);
		const baseInputs = await resolveMissionInputs(mission!.inputs);
		const resolvedInputs: ResolvedInput[] = [...baseInputs];
		const preStep: AiDebugEntry['preStep'] = { kontextInjected: false };

		// Auto-inject the kontext singleton (if non-empty and not already
		// linked) so every mission has the user's standing context as
		// background. Decrypted client-side; never reaches the server.
		const alreadyHasKontext = mission!.inputs.some((i) => i.module === 'kontext');
		if (!alreadyHasKontext) {
			const kontextEntry = await loadKontextAsResolvedInput();
			if (kontextEntry) {
				resolvedInputs.push(kontextEntry);
				preStep.kontextInjected = true;
			}
		}

		// Pre-step web research: if the objective looks like research,
		// run the deep-research pipeline (mana-search + mana-llm) and
		// attach the summary + sources so the planner can decide which
		// to save via save_news_article. Failures are non-fatal — we
		// inject a synthetic "research failed" input instead so the
		// planner doesn't hallucinate that the search ran.
		if (RESEARCH_TRIGGER.test(mission!.objective)) {
			await enterPhase('resolving-inputs', 'Web-Recherche…');
			try {
				const research = await runWebResearch(mission!);
				if (research) {
					resolvedInputs.push(research.input);
					preStep.webResearch = {
						ok: true,
						sourceCount: research.sourceCount,
						summary: research.summary,
					};
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.warn('[MissionRunner] web-research pre-step failed:', err);
				await enterPhase('resolving-inputs', `Web-Recherche fehlgeschlagen: ${msg.slice(0, 80)}`);
				preStep.webResearch = { ok: false, error: msg };
				resolvedInputs.push({
					id: 'web-research-error',
					module: 'research',
					table: 'researchResults',
					title: 'Web-Recherche FEHLGESCHLAGEN',
					content: [
						`Die automatische Web-Recherche konnte nicht ausgeführt werden.`,
						`Fehler: ${msg}`,
						``,
						`Wichtig: Du hast aktuell KEINE echten Quellen-URLs.`,
						`Rufe NICHT save_news_article auf — du würdest URLs erfinden.`,
						`Lege stattdessen einen kurzen Erinnerungs-Task an, dass die Recherche manuell nachgeholt werden muss.`,
					].join('\n'),
				});
			}
			await checkCancel();
		}

		const availableTools = getAvailableToolsForAi(aiActor);
		await checkCancel();

		// ── Phase: calling-llm ─────────────────────────────────
		await enterPhase('calling-llm', 'frage Planner an');
		let plan: AiPlanOutput;
		try {
			plan = await deps.plan({ mission: mission!, resolvedInputs, availableTools });
		} catch (err) {
			// Capture even the failure for debug visibility before re-throwing.
			if (isAiDebugEnabled()) {
				void recordAiDebug({
					iterationId,
					missionId: mission!.id,
					missionTitle: mission!.title,
					missionObjective: mission!.objective,
					capturedAt: new Date().toISOString(),
					resolvedInputs,
					preStep,
					plannerError: err instanceof Error ? err.message : String(err),
				});
			}
			throw err;
		}
		await checkCancel();

		// Persist debug capture if enabled. Off by default in production
		// (toggle via Settings or `localStorage.setItem('mana.ai.debug','1')`).
		if (isAiDebugEnabled()) {
			void recordAiDebug({
				iterationId,
				missionId: mission!.id,
				missionTitle: mission!.title,
				missionObjective: mission!.objective,
				capturedAt: new Date().toISOString(),
				resolvedInputs,
				preStep,
				planner: plan.debug,
			});
		}

		// ── Phase: parsing-response ────────────────────────────
		await enterPhase('parsing-response', `${plan.steps.length} Step(s) erhalten`);
		await checkCancel();

		// ── Phase: staging-proposals ───────────────────────────
		const stage = deps.stageStep ?? defaultStageStep;
		const recordedSteps: PlanStep[] = [];
		let stagedCount = 0;
		let failedCount = 0;

		for (const [i, ps] of plan.steps.entries()) {
			await enterPhase('staging-proposals', `Step ${i + 1} von ${plan.steps.length}`);
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

		await enterPhase('finalizing');
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
			errorDetails: {
				name: err instanceof Error ? err.name : 'UnknownError',
				message: msg,
				phase: lastPhase,
				stack: err instanceof Error ? err.stack : undefined,
			},
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

/** Read the kontext singleton + decrypt; returns null if empty/missing. */
async function loadKontextAsResolvedInput(): Promise<ResolvedInput | null> {
	try {
		const local = await db
			.table<{ id: string; content?: string; deletedAt?: string }>('kontextDoc')
			.get(KONTEXT_SINGLETON_ID);
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('kontextDoc', [local]);
		const content = decrypted?.content?.trim();
		if (!content) return null;
		return {
			id: KONTEXT_SINGLETON_ID,
			module: 'kontext',
			table: 'kontextDoc',
			title: 'Kontext (Standing)',
			content,
		};
	} catch (err) {
		console.warn('[MissionRunner] kontext auto-inject failed:', err);
		return null;
	}
}

/** Run the deep-research pipeline against the mission objective and
 *  collapse its summary + sources into one ResolvedInput formatted so
 *  the planner can copy URLs into save_news_article calls. */
interface WebResearchOutcome {
	input: ResolvedInput;
	sourceCount: number;
	summary: string;
}

async function runWebResearch(mission: Mission): Promise<WebResearchOutcome | null> {
	const result = await researchApi.startSync({
		// Tag the run with the mission id so backend logs can correlate.
		questionId: `mission:${mission.id}`,
		title: mission.objective.slice(0, 500),
		description: mission.conceptMarkdown?.slice(0, 4000),
		depth: 'quick',
	});
	if (result.status === 'error' || !result.summary) return null;

	const sources = await researchApi.listSources(result.id);
	const sourcesBlock = sources
		.slice(0, 8)
		.map((s, i) =>
			`[${i + 1}] ${s.title || s.url}\n    URL: ${s.url}\n    ${s.snippet ?? ''}`.trim()
		)
		.join('\n\n');

	const content = [
		`Zusammenfassung (Tiefe: ${result.depth}):`,
		result.summary,
		'',
		'Quellen (kopiere die URL beim Aufruf von save_news_article):',
		sourcesBlock || '(keine Quellen)',
	].join('\n');

	return {
		input: {
			id: result.id,
			module: 'research',
			table: 'researchResults',
			title: 'Web-Recherche zu diesem Auftrag',
			content,
		},
		sourceCount: sources.length,
		summary: result.summary,
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
