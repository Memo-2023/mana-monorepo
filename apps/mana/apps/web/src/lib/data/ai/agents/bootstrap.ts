/**
 * Default-agent bootstrap + legacy-mission backfill.
 *
 * Runs once at app-shell init (via `startMissionTick` in setup.ts or a
 * layout effect). Idempotent — safe to call on every mount, cross-tab
 * races resolve via the store's `getOrCreateAgent` upsert.
 *
 * Flow:
 *   1. Ensure a "Mana" agent exists with `id = DEFAULT_AGENT_ID`. This
 *      id mirrors `LEGACY_AI_PRINCIPAL` so historic events and fresh
 *      actors map to the same principal.
 *   2. One-off migration: any mission without `agentId` gets the
 *      default agent's id. This is a Dexie write so the change flows
 *      through sync like any user edit.
 *
 * The migration step is gated by a localStorage sentinel so it runs
 * only once per device per rollout. A user could manually re-trigger
 * it via `resetBackfillSentinel()`, but there is no UI for that — it
 * exists purely for test + recovery plumbing.
 */

import { db } from '../../database';
import type { Mission } from '../missions/types';
import { MISSIONS_TABLE } from '../missions/types';
import { getOrCreateAgent } from './store';
import type { Agent } from './types';
import { DEFAULT_AGENT_ID, DEFAULT_AGENT_NAME } from './types';

const BACKFILL_SENTINEL_KEY = 'mana:agents:default-backfill:v1';

/**
 * Create the default agent if missing. Returns the materialized agent
 * record. Safe under concurrent tabs — the store's `getOrCreateAgent`
 * dedupes on the stable id.
 */
export async function ensureDefaultAgent(): Promise<Agent> {
	return getOrCreateAgent({
		id: DEFAULT_AGENT_ID,
		name: DEFAULT_AGENT_NAME,
		avatar: '🤖',
		role: 'Standard-Assistent für alle Missionen',
	});
}

/**
 * Backfill `agentId` on every mission that predates the Multi-Agent
 * rollout. Runs at most once per device via a localStorage sentinel.
 * Returns the number of rows that were actually updated.
 */
export async function backfillMissionsAgentId(targetAgentId: string): Promise<number> {
	if (typeof window !== 'undefined' && window.localStorage.getItem(BACKFILL_SENTINEL_KEY)) {
		return 0;
	}
	const table = db.table<Mission>(MISSIONS_TABLE);
	const all = await table.toArray();
	const pending = all.filter((m) => !m.agentId && !m.deletedAt);
	if (pending.length === 0) {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(BACKFILL_SENTINEL_KEY, new Date().toISOString());
		}
		return 0;
	}

	// Batched update — Dexie has no bulkUpdate for partial fields, so
	// we iterate. These writes go through the sync pipeline like any
	// other update.
	const now = new Date().toISOString();
	await db.transaction('rw', table, async () => {
		for (const m of pending) {
			await table.update(m.id, { agentId: targetAgentId, updatedAt: now });
		}
	});

	if (typeof window !== 'undefined') {
		window.localStorage.setItem(BACKFILL_SENTINEL_KEY, now);
	}
	return pending.length;
}

/**
 * Convenience that does both: ensures the default agent exists, then
 * backfills mission agentIds. Fires and forgets from the app-shell
 * init; errors are logged but never thrown.
 */
export async function runAgentsBootstrap(): Promise<void> {
	try {
		const agent = await ensureDefaultAgent();
		const migrated = await backfillMissionsAgentId(agent.id);
		if (migrated > 0) {
			console.info(`[agents] backfilled agentId on ${migrated} legacy mission(s) → ${agent.name}`);
		}
	} catch (err) {
		console.error('[agents] bootstrap failed:', err);
	}
}

// ─── Test / recovery helpers ──────────────────────────────

/** Clear the backfill sentinel so the next call re-runs the migration.
 *  Not wired into any UI; exported for integration tests + manual
 *  recovery via the browser console. */
export function resetBackfillSentinel(): void {
	if (typeof window !== 'undefined') {
		window.localStorage.removeItem(BACKFILL_SENTINEL_KEY);
	}
}
