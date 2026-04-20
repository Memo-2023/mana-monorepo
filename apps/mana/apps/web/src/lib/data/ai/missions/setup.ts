/**
 * Production wiring for the Mission Runner.
 *
 * Connects the dependency-injected runner to the real mana-llm client
 * and drives `runDueMissions` on a foreground interval.
 *
 * Use pattern:
 *
 *   // in +layout.svelte (app-shell init)
 *   import { startMissionTick } from '$lib/data/ai/missions/setup';
 *   onMount(() => startMissionTick());
 *
 * The tick is intentionally foreground-only for now — a background
 * service worker for offline-of-tab execution is tracked as Phase 7;
 * see COMPANION_BRAIN_ARCHITECTURE.md §20.5.
 */

import { createManaLlmClient } from './llm-client';
import { runDueMissions, type MissionRunnerDeps } from './runner';
import { registerDefaultInputResolvers } from './default-resolvers';
import { runAgentsBootstrap } from '../agents/bootstrap';
// Side-effect imports to populate the seed-handler registry before any
// template is applied. Keep this list tight — each module pulls its
// own imports (encryptRecord, Dexie tables, etc.) so adding a seed
// handler to a rarely-used module slows down the hot path otherwise.
// See docs/plans/workbench-templates.md §T1.
import '$lib/modules/meditate/seed';
import '$lib/modules/habits/seed';
import '$lib/companion/goals/seed';

/** Default interval between tick scans. One minute is fine for foreground use. */
const DEFAULT_TICK_INTERVAL_MS = 60_000;

export const productionDeps: MissionRunnerDeps = {
	llm: createManaLlmClient(),
	// model + executeTool defaults handled inside the runner.
};

let tickHandle: ReturnType<typeof setInterval> | null = null;
let ticking = false;

/**
 * Start the Mission tick. Idempotent — calling twice is a no-op. Returns a
 * stop function so test / teardown code can cancel it.
 */
export function startMissionTick(intervalMs: number = DEFAULT_TICK_INTERVAL_MS): () => void {
	if (tickHandle !== null) return stopMissionTick;
	registerDefaultInputResolvers();

	// Multi-Agent Workbench: ensure a default "Mana" agent exists and
	// backfill agentId on legacy missions. Fire-and-forget — the runner
	// itself tolerates missions without an agentId during the migration
	// window. See docs/plans/multi-agent-workbench.md §Phase 2d.
	void runAgentsBootstrap();

	const tickOnce = async () => {
		// Guard against overlap — a slow LLM run could pile up multiple ticks.
		if (ticking) return;
		ticking = true;
		try {
			await runDueMissions(new Date(), productionDeps);
		} catch (err) {
			console.error('[MissionTick] scan threw:', err);
		} finally {
			ticking = false;
		}
	};

	// Run once immediately so a just-due mission doesn't wait a full interval.
	void tickOnce();
	tickHandle = setInterval(() => void tickOnce(), intervalMs);
	return stopMissionTick;
}

export function stopMissionTick(): void {
	if (tickHandle !== null) {
		clearInterval(tickHandle);
		tickHandle = null;
	}
}

/** Test / debug helper — whether the tick is currently scheduled. */
export function isMissionTickRunning(): boolean {
	return tickHandle !== null;
}
