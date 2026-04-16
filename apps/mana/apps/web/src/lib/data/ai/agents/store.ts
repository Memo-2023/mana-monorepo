/**
 * Agent store — CRUD for the named AI personas that own Missions.
 *
 * See `docs/plans/multi-agent-workbench.md`. All writes go through
 * Dexie + encryption pipeline the same way notes/missions do; the
 * `systemPrompt` + `memory` fields are encrypted per the registry.
 *
 * Name uniqueness is enforced at write time here (not via a Dexie
 * unique index) because the default-agent-bootstrap race between two
 * browser tabs would otherwise throw ConstraintError. The store's
 * `findByName` pre-check is racy in principle, but our write layer
 * is single-threaded per tab; cross-tab races resolve via LWW on
 * sync — whichever tab's write was later wins.
 */

import { db } from '../../database';
import { encryptRecord } from '../../crypto';
import { DEFAULT_AI_POLICY } from '../policy';
import type { AiPolicy } from '@mana/shared-ai';
import type { Agent, AgentState } from './types';
import { AGENTS_TABLE } from './types';

/** JSON-roundtrip deep clone to strip Svelte 5 `$state` proxies before
 *  records hit Dexie. Same pattern used in mission/store.ts. */
function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

const table = () => db.table<Agent>(AGENTS_TABLE);

// ── Create ─────────────────────────────────────────────────

export interface CreateAgentInput {
	id?: string;
	name: string;
	role: string;
	avatar?: string;
	systemPrompt?: string;
	memory?: string;
	policy?: AiPolicy;
	maxTokensPerDay?: number;
	maxConcurrentMissions?: number;
	state?: AgentState;
}

export class DuplicateAgentNameError extends Error {
	constructor(public readonly name: string) {
		super(`Agent name already in use: ${name}`);
		this.name = 'DuplicateAgentNameError';
	}
}

/** Insert a new agent. Throws DuplicateAgentNameError if the name is
 *  already taken by a non-deleted agent. */
export async function createAgent(input: CreateAgentInput): Promise<Agent> {
	const existing = await findByName(input.name);
	if (existing) throw new DuplicateAgentNameError(input.name);

	const now = new Date().toISOString();
	const agent: Agent = {
		id: input.id ?? crypto.randomUUID(),
		createdAt: now,
		updatedAt: now,
		name: input.name,
		role: input.role,
		avatar: input.avatar,
		systemPrompt: input.systemPrompt,
		memory: input.memory,
		policy: deepClone(input.policy ?? DEFAULT_AI_POLICY),
		maxTokensPerDay: input.maxTokensPerDay,
		maxConcurrentMissions: input.maxConcurrentMissions ?? 1,
		state: input.state ?? 'active',
	};
	const toWrite = { ...agent };
	await encryptRecord(AGENTS_TABLE, toWrite);
	await table().add(toWrite);
	return agent;
}

/**
 * Idempotent create: returns the agent with the given id if it exists
 * (non-deleted), otherwise creates it. Used by the default-agent
 * bootstrap to survive concurrent tab initialization races.
 */
export async function getOrCreateAgent(input: CreateAgentInput & { id: string }): Promise<Agent> {
	const existing = await getAgent(input.id);
	if (existing) return existing;
	try {
		return await createAgent(input);
	} catch (err) {
		if (err instanceof DuplicateAgentNameError) {
			// Another tab raced us. Refetch by id (bootstrap passes a stable
			// id) or fall back to the by-name lookup.
			const reload = await getAgent(input.id);
			if (reload) return reload;
			const byName = await findByName(input.name);
			if (byName) return byName;
		}
		throw err;
	}
}

// ── Read ───────────────────────────────────────────────────

export async function getAgent(id: string): Promise<Agent | undefined> {
	const a = await table().get(id);
	return a?.deletedAt ? undefined : a;
}

export async function findByName(name: string): Promise<Agent | undefined> {
	const all = await table().where('name').equals(name).toArray();
	return all.find((a) => !a.deletedAt);
}

export async function listAgents(filter: { state?: AgentState } = {}): Promise<Agent[]> {
	const all = await table().orderBy('createdAt').reverse().toArray();
	const visible = all.filter((a) => !a.deletedAt);
	return filter.state ? visible.filter((a) => a.state === filter.state) : visible;
}

// ── Update ─────────────────────────────────────────────────

export interface AgentPatch {
	name?: string;
	role?: string;
	avatar?: string;
	systemPrompt?: string;
	memory?: string;
	policy?: AiPolicy;
	maxTokensPerDay?: number;
	maxConcurrentMissions?: number;
	scopeTagIds?: string[];
	state?: AgentState;
}

export async function updateAgent(id: string, patch: AgentPatch): Promise<void> {
	if (patch.name) {
		const clash = await findByName(patch.name);
		if (clash && clash.id !== id) {
			throw new DuplicateAgentNameError(patch.name);
		}
	}
	const mods: Partial<Agent> = {
		...deepClone(patch),
		updatedAt: new Date().toISOString(),
	};
	await encryptRecord(AGENTS_TABLE, mods);
	await table().update(id, mods);
}

// ── Lifecycle ──────────────────────────────────────────────

export async function archiveAgent(id: string): Promise<void> {
	await table().update(id, { state: 'archived', updatedAt: new Date().toISOString() });
}

export async function pauseAgent(id: string): Promise<void> {
	await table().update(id, { state: 'paused', updatedAt: new Date().toISOString() });
}

export async function resumeAgent(id: string): Promise<void> {
	await table().update(id, { state: 'active', updatedAt: new Date().toISOString() });
}

/** Soft-delete. Missions owned by the agent keep running; the Workbench
 *  renders them as "ghost-agent" until archived separately. Bringing an
 *  agent back requires an explicit undelete (not yet surfaced in UI). */
export async function deleteAgent(id: string): Promise<void> {
	await table().update(id, { deletedAt: new Date().toISOString() });
}
