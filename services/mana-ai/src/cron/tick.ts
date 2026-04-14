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
	buildPlannerPrompt,
	parsePlannerResponse,
	type AiPlanInput,
	type AiPlanOutput,
	type Mission,
} from '@mana/shared-ai';
import { getSql, type Sql } from '../db/connection';
import { resolveServerInputs } from '../db/resolvers';
import { listDueMissions, type ServerMission } from '../db/missions-projection';
import { appendServerIteration, planToIteration } from '../db/iteration-writer';
import { refreshSnapshots } from '../db/snapshot-refresh';
import { PlannerClient } from '../planner/client';
import { AI_AVAILABLE_TOOLS, AI_AVAILABLE_TOOL_NAMES } from '../planner/tools';
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
} from '../metrics';
import type { Config } from '../config';

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
		// Bring the snapshot table up to date before querying it —
		// cheap incremental pass, O(new changes since last tick).
		const refresh = await refreshSnapshots(sql);
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

		const planner = new PlannerClient(config.manaLlmUrl, config.serviceKey);

		for (const m of missions) {
			try {
				const plan = await planOneMission(m, planner, sql);
				if (plan === null) {
					parseFailures++;
					parseFailuresTotal.inc();
					continue;
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
				});
				plansWrittenBack++;
				plansWrittenBackTotal.inc();

				console.log(
					`[mana-ai tick] mission=${m.id} user=${m.userId} plan=${plan.steps.length}step(s) iteration=${iterationId}`
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
 * Turn one due ServerMission into an {@link AiPlanOutput} via the LLM.
 * Returns null on parse failure — the tick records that as a separate
 * stat rather than throwing, so one flaky response doesn't abort the
 * queue.
 */
async function planOneMission(
	m: ServerMission,
	planner: PlannerClient,
	sql: Sql
): Promise<AiPlanOutput | null> {
	const mission = serverMissionToSharedMission(m);
	// Resolvers skip silently for modules they don't handle (notes / kontext
	// etc. are encrypted — server can't project them). The Planner then sees
	// only plaintext-safe context (today: goals), plus concept + objective.
	const resolvedInputs = await resolveServerInputs(sql, m.inputs, m.userId);
	const input: AiPlanInput = {
		mission,
		resolvedInputs,
		availableTools: AI_AVAILABLE_TOOLS,
	};
	const messages = buildPlannerPrompt(input);
	const result = await planner.complete(messages);
	const parsed = parsePlannerResponse(result.content, AI_AVAILABLE_TOOL_NAMES);
	if (!parsed.ok) {
		console.warn(
			`[mana-ai tick] mission=${m.id} parse failed: ${parsed.reason} — raw:`,
			parsed.raw?.slice(0, 200)
		);
		return null;
	}
	return parsed.value;
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
