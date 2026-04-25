/**
 * Default-agent bootstrap + legacy-mission backfill.
 *
 * Runs once at app-shell init (via `startMissionTick` in setup.ts or a
 * layout effect) and once per Space activation (via the
 * onActiveSpaceChanged hook in 2d.4). Idempotent — safe to call on
 * every mount, cross-tab races resolve via the store's
 * `getOrCreateAgent` upsert.
 *
 * Per-Space since Phase 2d.3 of the space-scoped data model rollout:
 * every Space gets its own default agent. Personal-Space keeps the
 * legacy `DEFAULT_AGENT_ID` + "Mana" name to preserve historic Actor
 * attribution (`__lastActor.principalId` on pre-migration records
 * points at `LEGACY_AI_PRINCIPAL` which equals `DEFAULT_AGENT_ID`).
 * Shared/Brand/Family/Team/Club/Practice Spaces get a deterministic
 * per-Space id (`default:<spaceId>`) and a SpaceType-aware display
 * name so users don't see three "Mana" in their agent picker.
 *
 * The mission-backfill step is gated by a localStorage sentinel so it
 * runs only once per device per rollout. Re-trigger via
 * `resetBackfillSentinel()` (no UI — test/recovery plumbing only).
 */

import type { SpaceType } from '@mana/shared-types';
import { db } from '../../database';
import { encryptRecord } from '../../crypto';
import type { Mission } from '../missions/types';
import { MISSIONS_TABLE } from '../missions/types';
import { getActiveSpace } from '../../scope/active-space.svelte';
import { getEffectiveSpaceId } from '../../scope/scoped-db';
import { DEFAULT_AI_POLICY } from '../policy';
import { getAgent } from './store';
import type { Agent } from './types';
import { AGENTS_TABLE, DEFAULT_AGENT_ID, DEFAULT_AGENT_NAME } from './types';

/**
 * Display name for the default agent bootstrapped in each Space type.
 * Personal keeps "Mana" to match legacy records; everything else picks
 * a name that reads naturally for that kind of Space.
 */
const DEFAULT_AGENT_NAMES: Record<SpaceType, string> = {
	personal: DEFAULT_AGENT_NAME, // "Mana"
	family: 'Familien-Helfer',
	team: 'Team-Assistent',
	brand: 'Brand-Assistent',
	club: 'Verein-Helfer',
	practice: 'Praxis-Assistent',
};

const DEFAULT_AGENT_ROLES: Record<SpaceType, string> = {
	personal: 'Standard-Assistent für alle Missionen',
	family: 'Hilft der Familie bei gemeinsamen Aufgaben, Einkäufen und Planung',
	team: 'Koordiniert Team-Workflows, Sprints und gemeinsame Deliverables',
	brand: 'Unterstützt bei Kampagnen, Content und Kundenkommunikation',
	club: 'Hilft bei Vereinsorganisation, Veranstaltungen und Mitgliederbetreuung',
	practice: 'Unterstützt Praxisabläufe, Termine und Patientenkommunikation',
};

/**
 * Stable id for the default agent in a Space. Personal-Space maps to
 * the legacy DEFAULT_AGENT_ID so historic Actor attribution keeps
 * rendering; every other Space type uses `default:<spaceId>` which is
 * deterministic + collision-free across Spaces.
 */
function defaultAgentIdForSpace(spaceId: string, spaceType: SpaceType): string {
	return spaceType === 'personal' ? DEFAULT_AGENT_ID : `default:${spaceId}`;
}

const BACKFILL_SENTINEL_KEY = 'mana:agents:default-backfill:v1';

/**
 * Create the default agent for the active Space if missing. Returns
 * the materialized agent. If no Space is active yet, falls back to the
 * legacy Personal-Space default so first-boot before space-load still
 * has an agent to attribute writes to.
 *
 * We bypass the regular createAgent path (which enforces global
 * name-uniqueness) because the same display name — e.g.
 * "Familien-Helfer" — is expected to exist across multiple Spaces of
 * the same type. Deduplication is by the deterministic per-Space id
 * instead; cross-tab races land on the same id and lose cleanly to
 * Dexie's add-or-skip.
 */
export async function ensureDefaultAgent(): Promise<Agent> {
	const space = getActiveSpace();
	const spaceType: SpaceType = space?.type ?? 'personal';
	const spaceId = space?.id;

	const id = spaceId ? defaultAgentIdForSpace(spaceId, spaceType) : DEFAULT_AGENT_ID;

	const existing = await getAgent(id);
	if (existing) return existing;

	const now = new Date().toISOString();
	const agent: Agent = {
		id,
		createdAt: now,
		updatedAt: now,
		name: DEFAULT_AGENT_NAMES[spaceType],
		role: DEFAULT_AGENT_ROLES[spaceType],
		avatar: '🤖',
		policy: JSON.parse(JSON.stringify(DEFAULT_AI_POLICY)),
		maxConcurrentMissions: 1,
		state: 'active',
	};
	const toWrite: Agent = { ...agent };
	await encryptRecord(AGENTS_TABLE, toWrite);
	try {
		await db.table(AGENTS_TABLE).add({ ...toWrite, spaceId: getEffectiveSpaceId() });
	} catch (err) {
		// Race: another tab just wrote the same id. Re-fetch and return
		// that tab's record.
		const reload = await getAgent(id);
		if (reload) return reload;
		throw err;
	}
	return agent;
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
