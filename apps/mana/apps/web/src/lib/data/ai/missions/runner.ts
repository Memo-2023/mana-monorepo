/**
 * MissionRunner — executes one iteration of a Mission.
 *
 *   load mission
 *     ↓
 *   resolve inputs via registered resolvers
 *     ↓
 *   pre-step web research (when the objective looks like a research task)
 *     ↓
 *   build system + user prompts (compact — no tool listing)
 *     ↓
 *   runPlannerLoop with native function calling
 *     ↓
 *   each tool_call executes directly via the policy-gated executor;
 *   results feed back as tool-messages for the next turn
 *     ↓
 *   finishIteration(summary, overallStatus, executed-steps)
 *
 * Post-migration note: there is no propose/approve gate. Tools run
 * directly under the AI actor. The user's review surface is the
 * Workbench Timeline + per-iteration revert. See
 * docs/plans/planner-function-calling.md for the design rationale.
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
import { discoverByQuery, searchFeeds } from '$lib/modules/news-research/api';
import { withAgentScope } from '../scope-context';
import { isAiDebugEnabled, recordAiDebug, type AiDebugEntry } from './debug';
import { makeAgentActor, LEGACY_AI_PRINCIPAL, type Actor } from '../../events/actor';
import { getAgent } from '../agents/store';
import { DEFAULT_AGENT_NAME } from '../agents/types';
import type { Mission, MissionIteration, PlanStep } from './types';
import {
	AI_TOOL_CATALOG_BY_NAME,
	buildSystemPrompt,
	compactHistory,
	runPlannerLoop,
	runPrePlanGuardrails,
	runPreExecuteGuardrails,
	type ChatMessage,
	type LlmClient,
	type ResolvedInput,
	type ToolCallRequest,
	type ToolResult,
} from '@mana/shared-ai';

/** Heuristic: mission objective text that should trigger a pre-step
 *  web-research call. Keeps the trigger explicit so unrelated missions
 *  don't burn credits accidentally. */
const RESEARCH_TRIGGER = /\b(recherchier|research|news|finde|suche|aktuelle|neueste)/i;

/** Hard ceiling on planner rounds inside one iteration. One round = one
 *  LLM call plus whatever tool executions its output triggered. Matches
 *  the shared-ai default; re-declared here for clarity. */
const MAX_PLANNER_ROUNDS = 5;

/** Context-window ceiling for the compactor. Matches gemini-2.5-flash's
 *  1M-token budget. Missions can accumulate many iterations over time
 *  and — with read-heavy reasoning — chatty tool results; the compactor
 *  folds pre-tail turns at 92% so we never hit a 400 from the provider. */
const COMPACT_MAX_CTX = 1_000_000;

/** Hard timeout for one mission run. 180 s is comfortable for a cloud
 *  model doing up to 5 reasoning rounds; anything longer means a wedged
 *  backend and should fail the iteration rather than sit in `running`. */
const ITERATION_TIMEOUT_MS = 180_000;

class CancelledError extends Error {
	constructor(reason: string) {
		super(reason);
		this.name = 'CancelledError';
	}
}

// ─── Public API ─────────────────────────────────────────────────────

export interface MissionRunnerDeps {
	/** LLM transport. Typically the mana-llm client from llm-client.ts;
	 *  tests inject a MockLlmClient. */
	llm: LlmClient;
	/** Model id to pass to the LLM (provider/model). Defaults handled by
	 *  the client; exposed here so per-mission overrides can plug in. */
	model?: string;
	/** Per-tool executor. Tests inject a mock; production defaults to
	 *  the policy-gated `executeTool`. */
	executeTool?: (
		name: string,
		params: Record<string, unknown>,
		actor: Actor
	) => Promise<ToolResult>;
}

export interface RunMissionResult {
	readonly iteration: MissionIteration;
	readonly plannedSteps: number;
	readonly stagedSteps: number;
	readonly failedSteps: number;
}

/** Mutex so concurrent runMission calls don't interleave the ambient
 *  scope context. Queued runs wait until the previous one finishes. */
let runMutex: Promise<void> = Promise.resolve();

export async function runMission(
	missionId: string,
	deps: MissionRunnerDeps
): Promise<RunMissionResult> {
	let release: () => void;
	const prev = runMutex;
	runMutex = new Promise((r) => (release = r));
	await prev;
	try {
		return await runMissionInner(missionId, deps);
	} finally {
		release!();
	}
}

/** Scan all active missions whose `nextRunAt` has passed and run them
 *  once each. Drives the foreground tick wired in `+layout.svelte`. */
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

// ─── Implementation ─────────────────────────────────────────────────

async function runMissionInner(
	missionId: string,
	deps: MissionRunnerDeps
): Promise<RunMissionResult> {
	const mission = await getMission(missionId);
	if (!mission) throw new Error(`Mission not found: ${missionId}`);
	if (mission.state !== 'active') {
		throw new Error(`Mission ${missionId} is ${mission.state}, cannot run`);
	}

	const startedIteration = await startIteration(mission.id, { plan: [] });
	const iterationId = startedIteration.id;

	const owningAgent = mission.agentId ? await getAgent(mission.agentId) : null;
	const aiActor = makeAgentActor({
		agentId: owningAgent?.id ?? LEGACY_AI_PRINCIPAL,
		displayName: owningAgent?.name ?? DEFAULT_AGENT_NAME,
		missionId: mission.id,
		iterationId,
		rationale: mission.objective,
	});

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

	let lastPhase: import('@mana/shared-ai').IterationPhase | undefined;
	async function enterPhase(
		phase: import('@mana/shared-ai').IterationPhase,
		detail?: string
	): Promise<void> {
		lastPhase = phase;
		await setIterationPhase(mission!.id, iterationId, phase, detail);
	}

	const runToolCall = deps.executeTool ?? executeTool;

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

		// Pre-step web research (unchanged from pre-migration).
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

		// Pre-plan guardrail (kept — catches prompt-injection in resolved inputs etc.).
		const prePlanCheck = runPrePlanGuardrails({
			mission: mission!,
			resolvedInputs,
			availableTools,
		});
		if (!prePlanCheck.passed) {
			throw new Error(`Guardrail blocked: ${prePlanCheck.blockReason}`);
		}

		// ── Phase: calling-llm / reasoning loop ────────────────
		await enterPhase('calling-llm', 'Planner…');
		const { systemPrompt, userPrompt } = buildSystemPrompt({
			mission: mission!,
			resolvedInputs,
			agentSystemPrompt: owningAgent?.systemPrompt ?? null,
			agentMemory: owningAgent?.memory ?? null,
		});

		const loopResult = await runPlannerLoop({
			llm: deps.llm,
			input: {
				systemPrompt,
				userPrompt,
				tools: availableTools,
				model: deps.model ?? 'google/gemini-2.5-flash',
				maxRounds: MAX_PLANNER_ROUNDS,
				// Fan-out read tools when the planner requests several in
				// one round. Writes (propose policy) stay sequential so the
				// proposal inbox shows the LLM's intended ordering and the
				// pre-execute guardrail can reason about state built up by
				// prior steps in the same round.
				isParallelSafe: (name) => AI_TOOL_CATALOG_BY_NAME.get(name)?.defaultPolicy === 'auto',
				// Fold older turns into a compact-summary at 92% of
				// maxContextTokens. Same LlmClient + model as the
				// planner; one extra LLM call, but only when usage
				// actually approaches the ceiling.
				compactor: {
					maxContextTokens: COMPACT_MAX_CTX,
					compact: async (msgs) => {
						const res = await compactHistory(msgs, {
							llm: deps.llm,
							model: deps.model ?? 'google/gemini-2.5-flash',
						});
						return { messages: res.messages, compactedTurns: res.compactedTurns };
					},
				},
			},
			onToolCall: async (call: ToolCallRequest): Promise<ToolResult> => {
				await checkCancel();
				await enterPhase('staging-proposals', call.name);

				// Pre-execute guardrail per call. Failures come back as
				// tool-messages so the LLM can choose a different path.
				const execCheck = runPreExecuteGuardrails({
					summary: call.name,
					toolName: call.name,
					params: call.arguments,
					rationale: mission!.objective,
				});
				if (!execCheck.passed) {
					return {
						success: false,
						message: `Guardrail: ${execCheck.blockReason}`,
					};
				}

				try {
					return await runToolCall(call.name, call.arguments, aiActor);
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					console.error(`[MissionRunner] tool ${call.name} threw:`, err);
					return { success: false, message: `Tool execution failed: ${msg}` };
				}
			},
		});

		await checkCancel();

		// Build the persisted plan from the loop's executed calls.
		const recordedSteps: PlanStep[] = loopResult.executedCalls.map((ec, i) => ({
			id: `${iterationId}-${i}`,
			summary: renderStepSummary(ec.call, ec.result),
			intent: {
				kind: 'toolCall',
				toolName: ec.call.name,
				params: ec.call.arguments,
			},
			status: ec.result.success ? 'approved' : 'failed',
		}));

		if (isAiDebugEnabled()) {
			void recordAiDebug({
				iterationId,
				missionId: mission!.id,
				missionTitle: mission!.title,
				missionObjective: mission!.objective,
				capturedAt: new Date().toISOString(),
				resolvedInputs,
				preStep,
				rounds: loopResult.rounds,
				stopReason: loopResult.stopReason,
				messages: loopResult.messages as ChatMessage[],
			});
		}

		await enterPhase('finalizing');

		const failedCount = recordedSteps.filter((s) => s.status === 'failed').length;
		const planSummary =
			loopResult.summary ??
			(recordedSteps.length === 0
				? 'Keine Tool-Aufrufe — Mission hat nichts zu tun'
				: `${recordedSteps.length} Tool-Aufrufe ausgeführt (${failedCount} Fehler).`);

		return {
			recordedSteps,
			stagedCount: recordedSteps.length,
			failedCount,
			planSummary,
			planStepCount: recordedSteps.length,
		};
	}

	let recordedSteps: PlanStep[] = [];
	let failedCount = 0;
	let planSummary = '';
	let planStepCount = 0;
	try {
		const result = await Promise.race([
			withAgentScope(owningAgent?.scopeTagIds, runPipeline),
			timeoutPromise,
		]);
		recordedSteps = result.recordedSteps;
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

	// Status: everything executed → 'approved'. Some failures but not all → still 'approved'
	// (the user can revert). Only wholesale failure or zero progress is 'failed'.
	const overallStatus: MissionIteration['overallStatus'] =
		planStepCount === 0 ? 'approved' : failedCount === planStepCount ? 'failed' : 'approved';

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
		stagedSteps: planStepCount,
		failedSteps: failedCount,
	};
}

// ─── Helpers ────────────────────────────────────────────────────────

function renderStepSummary(call: ToolCallRequest, result: ToolResult): string {
	if (!result.success) {
		return `${call.name} (FEHLER: ${result.message.slice(0, 120)})`;
	}
	return result.message || call.name;
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

interface WebResearchOutcome {
	input: ResolvedInput;
	sourceCount: number;
	summary: string;
}

async function runWebResearch(mission: Mission): Promise<WebResearchOutcome | null> {
	// RSS-based news research via news-research module: discoverByQuery
	// finds matching feeds, searchFeeds ranks recent articles by relevance.
	const objective = mission.objective;
	const isGerman = /[äöüß]|recherchier|aktuelle|neueste|finde|suche/i.test(objective);
	const language = isGerman ? 'de' : 'en';

	const discovered = await discoverByQuery(objective, language);
	const feedUrls = discovered.feeds.slice(0, 10).map((f) => f.url);
	if (feedUrls.length === 0) {
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
			id: `news-research-${mission.id}`,
			module: 'news-research',
			table: 'rssArticles',
			title: 'News-Recherche (RSS) zu diesem Auftrag',
			content,
		},
		sourceCount: articles.length,
		summary: `${articles.length} Artikel aus ${feedUrls.length} Feeds.`,
	};
}
