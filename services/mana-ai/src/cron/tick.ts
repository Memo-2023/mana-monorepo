/**
 * Background tick — scans Postgres for due Missions and (eventually) runs
 * them through the Planner + writes the resulting plan back as a Mission
 * iteration.
 *
 * Current state (v0.1): reads due missions, logs the intent, does NOT
 * write back. Writing requires deciding how proposals materialize
 * server-side — see `CLAUDE.md` → "Open design questions" for the
 * trade-offs. Shipping this as a scaffold unblocks:
 *   - deployability of the service
 *   - smoke-testing Postgres connectivity + mana-llm reachability
 *   - next PR wires the actual mission-execution flow
 */

import { getSql } from '../db/connection';
import { listDueMissions } from '../db/missions-projection';
import { PlannerClient } from '../planner/client';
import type { Config } from '../config';

export interface TickStats {
	scannedAt: string;
	dueMissionCount: number;
	errors: string[];
}

let running = false;

/** One tick pass. Idempotent; overlap-guarded at module level. */
export async function runTickOnce(config: Config): Promise<TickStats> {
	if (running) {
		return { scannedAt: new Date().toISOString(), dueMissionCount: 0, errors: ['overlap-skipped'] };
	}
	running = true;
	const errors: string[] = [];
	let dueMissionCount = 0;
	const scannedAt = new Date().toISOString();

	try {
		const sql = getSql(config.syncDatabaseUrl);
		const missions = await listDueMissions(sql, scannedAt);
		dueMissionCount = missions.length;

		if (missions.length === 0) return { scannedAt, dueMissionCount, errors };

		// Planner is instantiated here but not invoked yet — see CLAUDE.md.
		// The constructor is cheap; holding onto it sets the shape for the
		// next PR that actually calls `complete()` per mission.
		void new PlannerClient(config.manaLlmUrl, config.serviceKey);

		for (const m of missions) {
			console.log(
				`[mana-ai tick] would plan mission=${m.id} user=${m.userId} title=${JSON.stringify(
					m.title
				)}`
			);
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		errors.push(msg);
		console.error('[mana-ai tick] error:', msg);
	} finally {
		running = false;
	}

	return { scannedAt, dueMissionCount, errors };
}

let handle: ReturnType<typeof setInterval> | null = null;

export function startTick(config: Config): () => void {
	if (!config.tickEnabled || handle !== null) return stopTick;
	// Kick once immediately so a just-due mission doesn't wait a full interval.
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
