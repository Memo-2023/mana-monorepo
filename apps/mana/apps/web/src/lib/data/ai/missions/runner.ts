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
import { discoverByQuery, searchFeeds } from '$lib/modules/news-research/api';
import { getAgentKontext } from '../agents/kontext';
import { withAgentScope } from '../scope-context';
import { isAiDebugEnabled, recordAiDebug, type AiDebugEntry, type PlannerCallDebug } from './debug';
import { makeAgentActor, LEGACY_AI_PRINCIPAL, type Actor } from '../../events/actor';
import { getAgent } from '../agents/store';
import { DEFAULT_AGENT_NAME } from '../agents/types';
import type { Mission, MissionIteration, PlanStep } from './types';
import type { AiPlanInput, AiPlanOutput, PlannedStep, ResolvedInput } from './planner/types';
import {
	runPrePlanGuardrails,
	runPostPlanGuardrails,
	runPreExecuteGuardrails,
} from '@mana/shared-ai';

/** Heuristic: mission objective text that should trigger a pre-step
 *  web-research call. Keeps the trigger explicit so unrelated missions
 *  don't burn credits accidentally. */
const RESEARCH_TRIGGER = /\b(recherchier|research|news|finde|suche|aktuelle|neueste)/i;

/** Reasoning-loop budget. Each LOOP iteration = one planner call + its
 *  auto-tool executions. The loop exits early when a propose-policy
 *  step is staged (human must approve before progressing) or the
 *  planner returns zero steps (it considers this subtask done).
 *  5 is generous for read-act-refine patterns ("list_notes → tag them")
 *  without running the LLM bill dry on stuck missions. */
const MAX_REASONING_LOOP_ITERATIONS = 5;

/** Min interval between Dexie phaseDetail writes during streaming.
 *  50 tokens/s × 500ms = ~25 tokens between writes — frequent enough
 *  for the UI to feel live, infrequent enough to avoid Dexie thrashing. */
const STREAMING_PHASE_THROTTLE_MS = 500;
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
	| {
			readonly ok: true;
			readonly proposalId: string;
			/** Full tool-result payload when the step auto-executed (proposalId
			 *  is empty). The reasoning loop reads this and feeds it back as
			 *  context for the next planner call so the agent can reason over
			 *  list/read outputs across steps. */
			readonly autoData?: unknown;
			readonly autoMessage?: string;
	  }
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
	// ran directly. Return the payload so the reasoning loop can feed it
	// back into the next planner call.
	return { ok: true, proposalId: '', autoData: result.data, autoMessage: result.message };
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

		// User context and agent kontext are available as explicit mission
		// inputs via the input picker — no auto-inject. The user decides
		// what context the AI sees.

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

		// ── Reasoning loop ─────────────────────────────────────
		// Each pass: call planner → stage steps. Auto-tools run inline
		// and their outputs become new ResolvedInputs so the NEXT planner
		// call can reason over them (e.g. list_notes → see titles →
		// stage add_tag_to_note per note). Loop exits when:
		//   • planner returns 0 steps                  → agent is done
		//   • any step requires user approval (propose) → user in the loop
		//   • budget exhausted (MAX_REASONING_LOOP_ITERATIONS)
		//   • a step fails hard (not tool-error; executor error)
		const stage = deps.stageStep ?? defaultStageStep;
		const loopInputs: ResolvedInput[] = [...resolvedInputs];
		const recordedSteps: PlanStep[] = [];
		const plannerCalls: PlannerCallDebug[] = [];
		const loopStepLog: NonNullable<AiDebugEntry['loopSteps']> = [];
		let stagedCount = 0;
		let failedCount = 0;
		let lastPlanSummary = '';
		let totalStepCount = 0;
		let loopIndex = 0;
		let stepCounter = 0;
		let humanInLoop = false;

		while (loopIndex < MAX_REASONING_LOOP_ITERATIONS) {
			// ── Phase: calling-llm ─────────────────────────────
			await enterPhase(
				'calling-llm',
				loopIndex === 0
					? 'frage Planner an'
					: `Planner Runde ${loopIndex + 1}/${MAX_REASONING_LOOP_ITERATIONS}`
			);
			let plan: AiPlanOutput;

			// Streaming: show live token progress while waiting for the
			// planner response. Throttled to avoid Dexie write floods.
			let streamTokenCount = 0;
			let lastStreamWrite = 0;
			const roundLabel = loopIndex === 0 ? '' : ` (Runde ${loopIndex + 1})`;
			const onToken = (_delta: string) => {
				streamTokenCount++;
				const now = Date.now();
				if (now - lastStreamWrite < STREAMING_PHASE_THROTTLE_MS) return;
				lastStreamWrite = now;
				void setIterationPhase(
					mission!.id,
					iterationId,
					'calling-llm',
					`empfange Plan${roundLabel}… ${streamTokenCount} tokens`
				);
			};

			// ── Guardrail: pre-plan ────────────────────────
			const planInput: AiPlanInput = {
				mission: mission!,
				resolvedInputs: loopInputs,
				availableTools,
				onToken,
			};
			const prePlanCheck = runPrePlanGuardrails(planInput);
			if (!prePlanCheck.passed) {
				throw new Error(`Guardrail blocked: ${prePlanCheck.blockReason}`);
			}

			try {
				plan = await deps.plan(planInput);
			} catch (err) {
				if (isAiDebugEnabled()) {
					void recordAiDebug({
						iterationId,
						missionId: mission!.id,
						missionTitle: mission!.title,
						missionObjective: mission!.objective,
						capturedAt: new Date().toISOString(),
						resolvedInputs: loopInputs,
						preStep,
						plannerCalls,
						loopSteps: loopStepLog,
						plannerError: err instanceof Error ? err.message : String(err),
					});
				}
				throw err;
			}
			await checkCancel();
			if (plan.debug) plannerCalls.push(plan.debug);
			lastPlanSummary = plan.summary;
			totalStepCount += plan.steps.length;

			if (plan.steps.length === 0) {
				// Planner has nothing more to do — agent considers this done.
				break;
			}

			// ── Guardrail: post-plan ──────────────────────────
			const postPlanCheck = runPostPlanGuardrails(planInput, plan);
			if (!postPlanCheck.passed) {
				throw new Error(`Guardrail blocked plan: ${postPlanCheck.blockReason}`);
			}

			// ── Phase: parsing-response ────────────────────────
			await enterPhase('parsing-response', `${plan.steps.length} Step(s) erhalten`);
			await checkCancel();

			// ── Phase: staging-proposals ───────────────────────
			const roundOutputs: Array<{ step: PlannedStep; message: string; data: unknown }> = [];
			for (const [i, ps] of plan.steps.entries()) {
				await enterPhase(
					'staging-proposals',
					`Runde ${loopIndex + 1} · Step ${i + 1}/${plan.steps.length}`
				);
				await checkCancel();

				// ── Guardrail: pre-execute ─────────────────────
				const execCheck = runPreExecuteGuardrails(ps);
				if (!execCheck.passed) {
					failedCount++;
					const stepId = `${iterationId}-${stepCounter++}`;
					recordedSteps.push({
						id: stepId,
						summary: `Guardrail: ${execCheck.blockReason}`,
						intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
						status: 'failed',
					});
					continue;
				}

				const outcome = await stage(ps, aiActor);
				const stepId = `${iterationId}-${stepCounter++}`;
				if (!outcome.ok) {
					failedCount++;
					recordedSteps.push({
						id: stepId,
						summary: ps.summary,
						intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
						status: 'failed',
					});
					continue;
				}

				stagedCount++;
				if (outcome.proposalId) {
					// Propose-policy: human must approve. Exit the loop after
					// this round so we don't stage proposals for hypothetical
					// follow-up steps that depend on the approval outcome.
					humanInLoop = true;
					recordedSteps.push({
						id: stepId,
						summary: ps.summary,
						intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
						proposalId: outcome.proposalId,
						status: 'staged',
					});
				} else {
					// Auto-policy: ran inline. Collect output for the next
					// planner call.
					recordedSteps.push({
						id: stepId,
						summary: ps.summary,
						intent: { kind: 'toolCall', toolName: ps.toolName, params: ps.params },
						status: 'approved',
					});
					roundOutputs.push({
						step: ps,
						message: outcome.autoMessage ?? '(ohne message)',
						data: outcome.autoData,
					});
				}
			}

			// Log loop outputs for debug-panel visibility.
			for (const o of roundOutputs) {
				loopStepLog.push({
					loopIndex,
					toolName: o.step.toolName,
					params: o.step.params,
					outputPreview: formatToolOutputPreview(o.message, o.data),
				});
			}

			if (humanInLoop) break;
			if (roundOutputs.length === 0) {
				// Every step either failed or was proposed — nothing new to
				// reason over. Prevents an infinite loop when the planner
				// only suggests proposable tools that keep failing.
				break;
			}

			// Feed tool outputs into the next planner call as a synthetic
			// ResolvedInput so the agent can chain its reasoning.
			loopInputs.push({
				id: `loop-outputs-${loopIndex}`,
				module: 'reasoning-loop',
				table: 'tool-outputs',
				title: `Zwischenergebnisse (Runde ${loopIndex + 1})`,
				content: formatToolOutputsForPrompt(roundOutputs),
			});

			loopIndex++;
		}

		if (isAiDebugEnabled()) {
			void recordAiDebug({
				iterationId,
				missionId: mission!.id,
				missionTitle: mission!.title,
				missionObjective: mission!.objective,
				capturedAt: new Date().toISOString(),
				resolvedInputs: loopInputs,
				preStep,
				plannerCalls,
				loopSteps: loopStepLog,
			});
		}

		await enterPhase('finalizing');
		return {
			recordedSteps,
			stagedCount,
			failedCount,
			planSummary: lastPlanSummary,
			planStepCount: totalStepCount,
		};
	}

	let recordedSteps: PlanStep[] = [];
	let stagedCount = 0;
	let failedCount = 0;
	let planSummary = '';
	let planStepCount = 0;
	try {
		const result = await Promise.race([
			withAgentScope(owningAgent?.scopeTagIds, runPipeline),
			timeoutPromise,
		]);
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

/** Load the agent-specific kontext doc. Falls back to null (caller
 *  may then fall back to the global singleton if desired). */
async function loadAgentKontextAsResolvedInput(agentId: string): Promise<ResolvedInput | null> {
	try {
		const doc = await getAgentKontext(agentId);
		if (!doc) return loadKontextAsResolvedInput(); // fallback to global
		return {
			id: doc.id,
			module: 'kontext',
			table: 'agentKontextDocs',
			title: 'Agent-Kontext',
			content: doc.content,
		};
	} catch (err) {
		console.warn('[MissionRunner] agent kontext load failed:', err);
		return null;
	}
}

/** Run the deep-research pipeline against the mission objective and
 *  collapse its summary + sources into one ResolvedInput formatted so
 *  the planner can copy URLs into save_news_article calls. */
/** Stringify a tool-output payload for the reasoning loop's next
 *  prompt. Keeps the blob compact — LLM context windows are finite and
 *  a raw JSON.stringify of a 200-row Dexie dump wastes tokens. */
function formatToolOutputsForPrompt(
	outputs: Array<{ step: PlannedStep; message: string; data: unknown }>
): string {
	const lines: string[] = [
		'Ausgaben der zuletzt ausgeführten Auto-Tools. Nutze diese Daten um die Mission weiterzuführen — z.B. für jede gelistete Notiz einen add_tag_to_note Aufruf pro Notiz.',
		'',
	];
	for (const o of outputs) {
		lines.push(`### ${o.step.toolName}(${JSON.stringify(o.step.params)})`);
		lines.push(o.message);
		if (o.data !== undefined && o.data !== null) {
			const json = safeStringify(o.data, 4000);
			lines.push('```json', json, '```');
		}
		lines.push('');
	}
	return lines.join('\n');
}

/** Short form for the debug-panel loopSteps log. */
function formatToolOutputPreview(message: string, data: unknown): string {
	if (data === undefined || data === null) return message;
	const json = safeStringify(data, 400);
	return `${message}\n${json}`;
}

function safeStringify(value: unknown, limit: number): string {
	try {
		const s = JSON.stringify(value, null, 2);
		return s.length > limit ? s.slice(0, limit) + '\n… (truncated)' : s;
	} catch {
		return String(value);
	}
}

interface WebResearchOutcome {
	input: ResolvedInput;
	sourceCount: number;
	summary: string;
}

async function runWebResearch(mission: Mission): Promise<WebResearchOutcome | null> {
	// RSS-based news research via news-research module: discoverByQuery
	// finds matching feeds, searchFeeds ranks recent articles by relevance.
	// Robust (own infra, no external SearXNG dependency), free (no credits),
	// and the documented happy-path for the AI companion's news flow.
	// Detect language hint from objective: German chars/words → de, else en.
	const objective = mission.objective;
	const isGerman = /[äöüß]|recherchier|aktuelle|neueste|finde|suche/i.test(objective);
	const language = isGerman ? 'de' : 'en';

	const discovered = await discoverByQuery(objective, language);
	const feedUrls = discovered.feeds.slice(0, 10).map((f) => f.url);
	if (feedUrls.length === 0) {
		// No feeds discovered — surface as failure so the planner doesn't
		// pretend it has data. Caller wraps this in a "research failed"
		// ResolvedInput.
		throw new Error(
			`news-research: keine RSS-Feeds für "${objective}" gefunden (${discovered.searched ?? 0} Quellen abgesucht).`
		);
	}

	const { articles } = await searchFeeds(feedUrls, objective, { limit: 10 });
	if (articles.length === 0) {
		throw new Error(
			`news-research: ${feedUrls.length} Feeds gefunden, aber 0 Artikel matchen "${objective}".`
		);
	}

	const articlesBlock = articles
		.map((a, i) =>
			`[${i + 1}] ${a.title}\n    URL: ${a.url}\n    ${a.publishedAt ?? 'unbekannt'} · ${a.feedUrl}\n    ${a.excerpt ?? ''}`.trim()
		)
		.join('\n\n');

	const content = [
		`Recherche-Ergebnis (RSS, ${feedUrls.length} Feeds, ${articles.length} Treffer):`,
		'',
		'WICHTIG: Für jeden relevanten Artikel rufe save_news_article(url, title, summary) auf.',
		'Erfinde keine URLs — nutze ausschließlich die hier gelisteten.',
		'Wähle 3-5 Artikel die am besten zum Mission-Ziel passen.',
		'',
		articlesBlock,
	].join('\n');

	return {
		input: {
			id: `news-research-${Date.now()}`,
			module: 'news-research',
			table: 'rssArticles',
			title: 'News-Recherche (RSS) zu diesem Auftrag',
			content,
		},
		sourceCount: articles.length,
		summary: `${articles.length} Artikel aus ${feedUrls.length} Feeds.`,
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
