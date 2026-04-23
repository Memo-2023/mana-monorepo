/**
 * Background tick — scans Postgres for due Missions, calls mana-llm via
 * the shared Planner prompt/parser, logs the resulting plan.
 *
 * Current state (v0.2): produces plans end-to-end, does NOT yet write
 * them back as Mission iterations. The write-back requires RLS-scoped
 * transactions on `mana_sync` (same pattern as the Go server's
 * `withUser`) — tracked as the next PR in `CLAUDE.md`.
 *
 * Input resolvers (`db/resolvers/`) plug plaintext-safe Mission context
 * into the prompt per due run. Encrypted tables (notes, kontext, …)
 * intentionally have no server-side resolver — the Planner only sees
 * what the user can't unambiguously mark private by design.
 */

import {
	buildSystemPrompt,
	compactHistory,
	runPlannerLoop,
	type Mission,
	type PlannedStep,
	type ToolCallRequest,
	type ToolResult,
	type ToolSchema,
} from '@mana/shared-ai';
import { getSql, type Sql } from '../db/connection';
import { resolveServerInputs } from '../db/resolvers';
import { listDueMissions, type ServerMission } from '../db/missions-projection';
import { loadActiveAgents, refreshAgentSnapshots, type ServerAgent } from '../db/agents-projection';
import { appendServerIteration, planToIteration } from '../db/iteration-writer';
import { refreshSnapshots } from '../db/snapshot-refresh';
import { createServerLlmClient, ProviderCallError } from '../planner/llm-client';
import { SERVER_TOOLS } from '../planner/tools';
import {
	ticksTotal,
	tickDuration,
	plansProducedTotal,
	plansWrittenBackTotal,
	parseFailuresTotal,
	missionErrorsTotal,
	snapshotsNewTotal,
	snapshotsUpdatedTotal,
	snapshotRowsAppliedTotal,
	grantSkipsTotal,
	agentDecisionsTotal,
	tokensUsedTotal,
	toolCallsTotal,
	plannerRoundsHistogram,
	providerErrorsTotal,
	compactionsTriggeredTotal,
	compactedTurnsHistogram,
} from '../metrics';
import { unwrapMissionGrant } from '../crypto/unwrap-grant';
import { detectInjectionMarker } from '@mana/tool-registry';
import { NewsResearchClient } from '../planner/news-research-client';
import { buildReminderChannel } from '../planner/reminders';
import { ManaResearchClient, type DeepResearchProvider } from '../clients/mana-research';
import {
	deletePendingResearchJob,
	getPendingResearchJob,
	insertPendingResearchJob,
	touchPendingResearchJob,
} from '../db/research-jobs';
import {
	researchJobsSubmittedTotal,
	researchJobsCompletedTotal,
	researchJobsFailedTotal,
	researchJobsPendingSkipsTotal,
} from '../metrics';
import type { ResolverContext } from '../db/resolvers/types';
import type { Config } from '../config';
import { withSpan } from '../tracing';

const ENC_PREFIX = 'enc:1:';

/** Heuristic: mission objectives that should trigger a pre-planning
 *  web-research step. Same regex the webapp uses in its reasoning loop
 *  (`data/ai/missions/runner.ts`). */
const RESEARCH_TRIGGER =
	/\b(recherchier|research|news|finde|suche|aktuelle|neueste|today|history|historisch|on this day)/i;

/** Strict opt-in for the expensive async deep-research path (Gemini
 *  Deep Research Max, ~$3–7 per task). Only matches explicit wording
 *  so users must deliberately ask for it in the mission objective.
 *  Gated further by `config.deepResearchEnabled` at the tick level. */
const DEEP_RESEARCH_TRIGGER =
	/\b(deep research|tiefe recherche|umfassende recherche|hintergrundrecherche|deep dive)\b/i;

const DEEP_RESEARCH_PROVIDER: DeepResearchProvider = 'gemini-deep-research-max';

/** True when the value looks like the webapp's AES-GCM wire format. */
function isCiphertext(value: string | undefined): value is string {
	return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

export interface TickStats {
	scannedAt: string;
	dueMissionCount: number;
	plansProduced: number;
	plansWrittenBack: number;
	parseFailures: number;
	errors: string[];
}

let running = false;

/** One tick pass. Idempotent; overlap-guarded at module level. */
export async function runTickOnce(config: Config): Promise<TickStats> {
	if (running) {
		return {
			scannedAt: new Date().toISOString(),
			dueMissionCount: 0,
			plansProduced: 0,
			plansWrittenBack: 0,
			parseFailures: 0,
			errors: ['overlap-skipped'],
		};
	}
	running = true;
	ticksTotal.inc();
	const tickEndTimer = tickDuration.startTimer();
	const errors: string[] = [];
	let dueMissionCount = 0;
	let plansProduced = 0;
	let plansWrittenBack = 0;
	let parseFailures = 0;
	const scannedAt = new Date().toISOString();

	try {
		const sql = getSql(config.syncDatabaseUrl);
		// Bring BOTH snapshot tables up to date before we query them. The
		// mission refresh is the expensive one (field-level LWW over the
		// full iterations array); agents refresh is lighter but runs
		// under the same incremental-cursor pattern.
		const [refresh] = await Promise.all([refreshSnapshots(sql), refreshAgentSnapshots(sql)]);
		snapshotsNewTotal.inc(refresh.newSnapshots);
		snapshotsUpdatedTotal.inc(refresh.updatedSnapshots);
		snapshotRowsAppliedTotal.inc(refresh.rowsApplied);
		if (refresh.rowsApplied > 0) {
			console.log(
				`[mana-ai tick] snapshot refresh: ${refresh.rowsApplied} rows → ${refresh.newSnapshots} new + ${refresh.updatedSnapshots} updated`
			);
		}
		const missions = await listDueMissions(sql, scannedAt);
		dueMissionCount = missions.length;

		if (missions.length === 0)
			return {
				scannedAt,
				dueMissionCount,
				plansProduced,
				plansWrittenBack,
				parseFailures,
				errors,
			};

		const llm = createServerLlmClient({
			baseUrl: config.manaLlmUrl,
			serviceKey: config.serviceKey,
		});

		// Per-user agent cache + concurrency counter, scoped to this
		// single tick. `activeRuns` counts missions we've already
		// processed for an agent — when we hit
		// agent.maxConcurrentMissions the remaining missions for that
		// agent are deferred to the next tick rather than run in
		// parallel.
		const agentsByUser = new Map<string, Map<string, ServerAgent>>();
		const activeRuns = new Map<string, number>();

		async function getAgent(m: ServerMission): Promise<ServerAgent | null> {
			if (!m.agentId) return null;
			let userMap = agentsByUser.get(m.userId);
			if (!userMap) {
				const list = await loadActiveAgents(sql, m.userId);
				userMap = new Map(list.map((a) => [a.id, a]));
				agentsByUser.set(m.userId, userMap);
			}
			return userMap.get(m.agentId) ?? null;
		}

		for (const m of missions) {
			const agent = await getAgent(m);

			// Guardrails before we burn an LLM call:
			//   1. Agent archived → skip silently; user has retired this agent.
			//   2. Agent paused → skip; intended as a soft pause of the
			//      whole persona across its missions.
			//   3. Per-agent concurrency exhausted for this tick → skip;
			//      runs again next tick after other missions finish.
			if (agent && agent.state === 'archived') {
				agentDecisionsTotal.inc({ decision: 'skipped-archived' });
				continue;
			}
			if (agent && agent.state === 'paused') {
				agentDecisionsTotal.inc({ decision: 'skipped-paused' });
				continue;
			}
			// Pretick token usage is surfaced to the reminder channel so the
			// planner sees a warning as it approaches the cap, rather than
			// getting cut off without explanation. Default 0 when the
			// agent has no cap or the query fails (reminder becomes a
			// no-op for that mission).
			let pretickUsage24h = 0;
			if (agent) {
				const used = activeRuns.get(agent.id) ?? 0;
				if (used >= agent.maxConcurrentMissions) {
					agentDecisionsTotal.inc({ decision: 'skipped-concurrency' });
					continue;
				}
				// Budget enforcement: check rolling 24h token usage.
				if (agent.maxTokensPerDay != null && agent.maxTokensPerDay >= 0) {
					pretickUsage24h = await getAgentTokenUsage24h(sql, m.userId, agent.id);
					if (pretickUsage24h >= agent.maxTokensPerDay) {
						agentDecisionsTotal.inc({ decision: 'skipped-budget' });
						continue;
					}
				}
				activeRuns.set(agent.id, used + 1);
			}

			try {
				const planResult = await withSpan(
					'tick.planMission',
					{
						'mission.id': m.id,
						'mission.title': m.title,
						'user.id': m.userId,
						'agent.id': agent?.id ?? 'legacy',
						'agent.name': agent?.name ?? 'Mana',
					},
					() => planOneMission(m, llm, sql, agent, config, pretickUsage24h)
				);
				if (planResult.outcome === 'skipped') {
					// Deep-research job still running — pick this mission
					// back up on the next tick. No plan produced, no
					// parse-failure accounting.
					continue;
				}
				if (planResult.outcome === 'failed') {
					parseFailures++;
					parseFailuresTotal.inc();
					continue;
				}
				const { plan, tokensUsed } = planResult;

				// Record token usage for budget tracking
				if (tokensUsed > 0 && agent) {
					await recordTokenUsage(sql, m.userId, agent.id, m.id, tokensUsed);
					tokensUsedTotal.inc({ agent_id: agent.id }, tokensUsed);
				}

				plansProduced++;
				plansProducedTotal.inc();

				const nowIso = new Date().toISOString();
				const iterationId = crypto.randomUUID();
				const newIteration = planToIteration(plan, iterationId, nowIso);
				const allIterations = [...m.iterations, newIteration] as (typeof newIteration)[];

				await appendServerIteration(sql, {
					userId: m.userId,
					missionId: m.id,
					allIterations,
					newIteration,
					nowIso,
					agent: agent ? { id: agent.id, name: agent.name } : undefined,
					iterationId,
					rationale: m.objective,
				});
				plansWrittenBack++;
				plansWrittenBackTotal.inc();
				if (agent) agentDecisionsTotal.inc({ decision: 'ran' });

				console.log(
					`[mana-ai tick] mission=${m.id} user=${m.userId} ` +
						`agent=${agent ? `${agent.name}(${agent.id.slice(0, 8)}…)` : 'legacy'} ` +
						`plan=${plan.steps.length}step(s) iteration=${iterationId}`
				);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				errors.push(`mission=${m.id}: ${msg}`);
				missionErrorsTotal.inc();
				console.error(`[mana-ai tick] mission=${m.id} run failed:`, msg);
			}
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		errors.push(msg);
		console.error('[mana-ai tick] scan error:', msg);
	} finally {
		running = false;
		tickEndTimer();
	}

	return { scannedAt, dueMissionCount, plansProduced, plansWrittenBack, parseFailures, errors };
}

/**
 * Plan one due mission via the shared runPlannerLoop. Returns the
 * executed (= planned-for-client) tool calls as an AiPlanOutput shape
 * that iteration-writer.ts understands.
 *
 * The server's ``onToolCall`` is a no-op that returns a "recorded"
 * acknowledgement. The server cannot actually apply writes — it has no
 * Dexie access — so it captures the LLM's intended tool calls and
 * writes them as the iteration's plan[] for the user's device to pick
 * up on sync. Read tools are filtered out at the SERVER_TOOLS level
 * (see planner/tools.ts) to keep the LLM from fabricating "read
 * results".
 */
type PlanMissionOutcome =
	| { outcome: 'planned'; plan: { summary: string; steps: PlannedStep[] }; tokensUsed: number }
	| { outcome: 'skipped'; reason: 'research-pending' }
	| { outcome: 'failed' };

async function planOneMission(
	m: ServerMission,
	llm: ReturnType<typeof createServerLlmClient>,
	sql: Sql,
	agent: ServerAgent | null,
	config: Config,
	pretickUsage24h: number
): Promise<PlanMissionOutcome> {
	const mission = serverMissionToSharedMission(m);
	// Resolve the mission's Key-Grant (if any) once per tick. An absent
	// grant is NOT an error — plaintext missions (goals-only) run fine
	// without one; encrypted-input missions degrade to "null inputs" and
	// the foreground runner takes over. A present-but-expired / -malformed
	// grant bumps a metric and otherwise behaves the same.
	const context = await buildResolverContext(m);
	const resolvedInputs = await resolveServerInputs(sql, m.inputs, m.userId, context);

	// ─── Deep research pre-planning (opt-in, cross-tick) ─────────
	// A pending job means a previous tick submitted an async research
	// task; we poll here. A completed result is injected as a
	// ResolvedInput and the plan proceeds normally; queued/running
	// means we bail this tick and try again next time. No pending job
	// + the opt-in trigger fires → we submit and bail.
	const deepInput = await handleDeepResearch(m, sql, config);
	if (deepInput === 'pending') {
		return { outcome: 'skipped', reason: 'research-pending' };
	}
	if (deepInput) {
		resolvedInputs.push(deepInput);
	}

	// Shallow pre-planning research step (RSS-based, synchronous). We
	// still run this when deep research didn't fire — same behaviour
	// as before. Skipped when deep research already supplied a
	// __web-research__ block so we don't double-feed the planner.
	if (
		!deepInput &&
		(RESEARCH_TRIGGER.test(m.objective) || RESEARCH_TRIGGER.test(m.conceptMarkdown))
	) {
		const nrc = new NewsResearchClient(config.manaApiUrl);
		const research = await nrc.research(m.objective, { language: 'de', limit: 8 });
		if (research) {
			resolvedInputs.push({
				id: '__web-research__',
				module: 'news-research',
				table: 'web',
				title: `Web-Research: "${m.objective.slice(0, 60)}"`,
				content: research.contextMarkdown,
			});
			console.log(
				`[mana-ai tick] mission=${m.id} pre-research: ${research.feedCount} feeds, ${research.articles.length} articles`
			);
		}
	}

	const agentSystemPrompt =
		agent && agent.systemPrompt && !isCiphertext(agent.systemPrompt) ? agent.systemPrompt : null;
	const agentMemory = agent && agent.memory && !isCiphertext(agent.memory) ? agent.memory : null;

	const { systemPrompt, userPrompt } = buildSystemPrompt({
		mission,
		resolvedInputs,
		agentSystemPrompt,
		agentMemory,
	});

	const tools = filterToolsByAgentPolicy(SERVER_TOOLS, agent);

	// Per-round reminder channel: injects transient hints (token-budget
	// warnings today; retry-loop detection, stale-data signals later)
	// into the NEXT LLM turn only. See `planner/reminders.ts` for the
	// individual producers and the Claude-Code <system-reminder>
	// rationale.
	const reminderChannel = buildReminderChannel({
		agent,
		mission: m,
		pretickUsage24h,
	});

	const plannerModel = 'google/gemini-2.5-flash';

	// Claude-Code wU2 pattern: fold the middle of messages into a structured
	// summary once cumulative tokens cross 92% of maxContextTokens. Uses
	// the same LLM + model as the planner itself; later we can route this
	// to a cheaper model (Haiku tier) when mana-llm supports it.
	const compactor =
		config.compactMaxContextTokens > 0
			? {
					maxContextTokens: config.compactMaxContextTokens,
					compact: async (msgs: Parameters<typeof compactHistory>[0]) => {
						const result = await compactHistory(msgs, { llm, model: plannerModel });
						if (result.compactedTurns > 0) {
							compactionsTriggeredTotal.inc();
							compactedTurnsHistogram.observe(result.compactedTurns);
							console.log(
								`[mana-ai tick] mission=${m.id} compacted ${result.compactedTurns} turns ` +
									`(goal=${result.summary.goal.slice(0, 60)}...)`
							);
						}
						return { messages: result.messages, compactedTurns: result.compactedTurns };
					},
				}
			: undefined;

	try {
		const loopResult = await runPlannerLoop({
			llm,
			input: {
				systemPrompt,
				userPrompt,
				tools,
				model: plannerModel,
				reminderChannel,
				compactor,
			},
			// Server-side onToolCall: no execution, just acknowledge.
			// The captured call lands in loopResult.executedCalls and
			// gets written as a PlanStep with status 'planned' — the
			// user's client applies it on sync.
			//
			// Policy gate on this layer is limited to freetext injection
			// inspection: the server can't enforce rate-limits across a
			// 60s tick and tools here are propose-only by construction
			// (filtered in SERVER_TOOLS), so destructive opt-in is
			// meaningless until the full tool-registry absorbs
			// AI_TOOL_CATALOG. Until then, flagged content is logged; the
			// webapp's policy enforces the actual block on apply.
			onToolCall: async (call: ToolCallRequest): Promise<ToolResult> => {
				if (config.policyMode !== 'off') {
					const marker = detectInjectionMarker(call.arguments);
					if (marker) {
						const label = config.policyMode === 'enforce' ? 'FLAG' : 'FLAG';
						console.warn(
							`[mana-ai policy] ${label} tool=${call.name} mission=${m.id} marker=${marker}`
						);
					}
				}
				return {
					success: true,
					message: 'recorded — pending client application',
				};
			},
		});

		// Observability: one counter tick per tool_call + one histogram
		// sample for round consumption. `policy` is pulled off the
		// catalog entry so a later change to Gemini-default flipping
		// auto→propose would show up in the labels without code changes.
		plannerRoundsHistogram.observe(loopResult.rounds);
		for (const ec of loopResult.executedCalls) {
			const catalogEntry = SERVER_TOOLS.find((t) => t.name === ec.call.name);
			const policy = catalogEntry?.defaultPolicy ?? 'propose';
			// Server-side execution is always deferred to the client —
			// the onToolCall stub returns success without running
			// anything. Real execution metrics will come from the
			// webapp runner once it emits its own Prom surface.
			toolCallsTotal.inc({ tool: ec.call.name, policy, outcome: 'deferred' });
		}

		return {
			outcome: 'planned',
			plan: {
				summary: loopResult.summary ?? '',
				steps: loopResult.executedCalls.map((ec) => ({
					summary: ec.call.name,
					toolName: ec.call.name,
					params: ec.call.arguments,
					rationale: '',
				})),
			},
			tokensUsed: loopResult.usage.totalTokens,
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (err instanceof ProviderCallError) {
			const provider = inferProviderFromModel('google/gemini-2.5-flash');
			providerErrorsTotal.inc({ provider, kind: err.kind });
		}
		console.warn(`[mana-ai tick] mission=${m.id} planner loop failed: ${msg}`);
		return { outcome: 'failed' };
	}
}

/**
 * Cross-tick state machine for the deep-research pre-planning path.
 *
 * Return value:
 *   - `'pending'`: a job is currently queued/running upstream; caller
 *     must skip this mission for this tick.
 *   - a ResolvedInput: a job just completed, feed it into the planner.
 *   - `null`: no deep-research involvement — fall through to the
 *     existing shallow path.
 */
async function handleDeepResearch(
	m: ServerMission,
	sql: Sql,
	config: Config
): Promise<
	'pending' | { id: string; module: string; table: string; title: string; content: string } | null
> {
	const client = new ManaResearchClient(config.manaResearchUrl, config.serviceKey);
	const existing = await getPendingResearchJob(sql, m.userId, m.id);

	if (existing) {
		const poll = await client.poll(m.userId, existing.taskId);
		if (!poll) {
			// Transport failure — keep the job around, try again next tick.
			await touchPendingResearchJob(sql, m.userId, m.id);
			researchJobsPendingSkipsTotal.inc();
			return 'pending';
		}

		if (poll.status === 'queued' || poll.status === 'running') {
			await touchPendingResearchJob(sql, m.userId, m.id);
			researchJobsPendingSkipsTotal.inc();
			return 'pending';
		}

		if (poll.status === 'failed' || poll.status === 'cancelled') {
			await deletePendingResearchJob(sql, m.userId, m.id);
			researchJobsFailedTotal.inc({ provider: existing.providerId });
			console.warn(
				`[mana-ai tick] mission=${m.id} deep-research failed (${existing.providerId}): ${poll.error ?? poll.status}`
			);
			// Fall through to shallow pre-planning this tick.
			return null;
		}

		// completed
		await deletePendingResearchJob(sql, m.userId, m.id);
		researchJobsCompletedTotal.inc({ provider: existing.providerId });
		const answer = poll.result?.answer;
		if (!answer || !answer.answer) {
			console.warn(`[mana-ai tick] mission=${m.id} deep-research completed without body`);
			return null;
		}
		console.log(
			`[mana-ai tick] mission=${m.id} deep-research done (${existing.providerId}): ` +
				`${answer.citations.length} citations, ${answer.answer.length} chars`
		);
		return {
			id: '__web-research__',
			module: 'news-research',
			table: 'web',
			title: `Deep Research: "${m.objective.slice(0, 60)}"`,
			content: formatDeepResearchContext(m.objective, answer),
		};
	}

	// No existing job. Do we want to submit one?
	if (!config.deepResearchEnabled) return null;
	if (!DEEP_RESEARCH_TRIGGER.test(m.objective) && !DEEP_RESEARCH_TRIGGER.test(m.conceptMarkdown)) {
		return null;
	}

	const submission = await client.submit(m.userId, m.objective, DEEP_RESEARCH_PROVIDER);
	if (!submission) {
		// Submit failed — fall through to shallow so the mission still runs.
		console.warn(
			`[mana-ai tick] mission=${m.id} deep-research submit failed, falling back to shallow`
		);
		return null;
	}
	await insertPendingResearchJob(sql, m.userId, m.id, submission.taskId, submission.providerId);
	researchJobsSubmittedTotal.inc({ provider: submission.providerId });
	researchJobsPendingSkipsTotal.inc();
	console.log(
		`[mana-ai tick] mission=${m.id} deep-research submitted ` +
			`(${submission.providerId}, task=${submission.taskId.slice(0, 16)}…, ${submission.costCredits}c)`
	);
	return 'pending';
}

/**
 * Render the deep-research answer into the same markdown-shape the
 * shallow pre-research step produces, so downstream planner prompts
 * don't need to distinguish the two sources.
 */
function formatDeepResearchContext(
	query: string,
	answer: import('@mana/shared-research').AgentAnswer
): string {
	const lines: string[] = [`# Deep-Research: "${query}"`, '', answer.answer.trim(), ''];
	if (answer.citations.length > 0) {
		lines.push('## Quellen');
		for (const c of answer.citations) {
			lines.push(`- [${c.title}](${c.url})${c.snippet ? ` — ${c.snippet}` : ''}`);
		}
		lines.push('');
	}
	lines.push(
		'---',
		'Nutze diese Quellen fuer deinen Plan. Verwende nur URLs die oben stehen; erfinde keine.'
	);
	return lines.join('\n');
}

/** Parse provider name off a `provider/model` string. Used purely for
 *  metric labelling — falls back to `'unknown'` so a misconfigured
 *  model id doesn't crash the counter. */
function inferProviderFromModel(model: string): string {
	const [provider] = model.split('/', 1);
	return provider || 'unknown';
}

/**
 * Drop tools the agent's policy denies so the Planner never sees a tool
 * it can't use. `propose` and `auto` stay (but the server only hands the
 * LLM `propose`-default tools to begin with — see planner/tools.ts).
 * Resolution order matches the webapp's `resolvePolicy`:
 *   tools[name] ?? defaultsByModule[tool.module] ?? defaultForAi
 */
function filterToolsByAgentPolicy(
	tools: readonly ToolSchema[],
	agent: ServerAgent | null
): ToolSchema[] {
	if (!agent?.policy) return tools as ToolSchema[];
	const policy = agent.policy;
	return tools.filter((t) => {
		const byTool = policy.tools[t.name];
		if (byTool) return byTool !== 'deny';
		const byModule = policy.defaultsByModule?.[t.module];
		if (byModule) return byModule !== 'deny';
		return policy.defaultForAi !== 'deny';
	});
}

/**
 * Build the per-mission ResolverContext. Extracted so the tick flow
 * stays readable and so unit tests can drive it directly.
 *
 * For a mission without a grant, the context has no MDK and no
 * allowlist — encrypted resolvers return null for their refs, plaintext
 * resolvers run unchanged. For a mission WITH a grant, we try to unwrap
 * and build an allowlist; failures bump a metric but never throw.
 */
async function buildResolverContext(m: ServerMission): Promise<ResolverContext> {
	if (!m.grant) return { missionId: m.id };

	const unwrap = await unwrapMissionGrant(m.grant);
	if (!unwrap.ok) {
		grantSkipsTotal.inc({ reason: unwrap.reason });
		console.warn(`[mana-ai tick] mission=${m.id} grant unwrap skipped: reason=${unwrap.reason}`);
		return { missionId: m.id };
	}

	return {
		missionId: m.id,
		mdk: unwrap.mdk,
		allowlist: new Set(m.grant.derivation.recordIds),
	};
}

/**
 * Projection → shared-ai Mission shape. The projection leaves a few
 * fields as `unknown` because the server doesn't need to interpret them
 * (cadence math, iteration bookkeeping live in the webapp); we cast
 * once here at the boundary.
 */
function serverMissionToSharedMission(m: ServerMission): Mission {
	return {
		id: m.id,
		createdAt: m.nextRunAt ?? new Date().toISOString(),
		updatedAt: m.nextRunAt ?? new Date().toISOString(),
		title: m.title,
		conceptMarkdown: m.conceptMarkdown,
		objective: m.objective,
		inputs: m.inputs,
		cadence: m.cadence as Mission['cadence'],
		state: m.state,
		nextRunAt: m.nextRunAt,
		iterations: m.iterations as Mission['iterations'],
		userId: m.userId,
	};
}

// ── Token Budget Helpers ──────────────────────────────────────

/** Query the rolling 24h token usage for an agent. */
async function getAgentTokenUsage24h(sql: Sql, userId: string, agentId: string): Promise<number> {
	const rows = await sql<{ total: string }[]>`
		SELECT COALESCE(SUM(tokens_used), 0) AS total
		FROM mana_ai.token_usage
		WHERE user_id = ${userId}
			AND agent_id = ${agentId}
			AND ts > now() - interval '24 hours'
	`;
	return parseInt(rows[0]?.total ?? '0', 10);
}

/** Record token consumption for budget tracking. */
async function recordTokenUsage(
	sql: Sql,
	userId: string,
	agentId: string,
	missionId: string,
	tokensUsed: number
): Promise<void> {
	await sql`
		INSERT INTO mana_ai.token_usage (user_id, agent_id, mission_id, tokens_used)
		VALUES (${userId}, ${agentId}, ${missionId}, ${tokensUsed})
	`;
}

let handle: ReturnType<typeof setInterval> | null = null;

export function startTick(config: Config): () => void {
	if (!config.tickEnabled || handle !== null) return stopTick;
	void runTickOnce(config);
	handle = setInterval(() => void runTickOnce(config), config.tickIntervalMs);
	return stopTick;
}

export function stopTick(): void {
	if (handle !== null) {
		clearInterval(handle);
		handle = null;
	}
}

export function isTickRunning(): boolean {
	return handle !== null;
}
