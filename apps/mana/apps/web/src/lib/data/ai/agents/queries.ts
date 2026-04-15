/**
 * Svelte 5 reactive queries over the `agents` Dexie table.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '../../database';
import { decryptRecords } from '../../crypto';
import type { Agent, AgentState } from './types';
import { AGENTS_TABLE } from './types';

export interface UseAgentsOptions {
	state?: AgentState;
}

/** All non-deleted agents, newest first. */
export function useAgents(options: UseAgentsOptions = {}) {
	const { state } = options;
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<Agent>(AGENTS_TABLE).orderBy('createdAt').reverse().toArray();
		const visible = all.filter((a) => !a.deletedAt);
		const filtered = state ? visible.filter((a) => a.state === state) : visible;
		return decryptRecords(AGENTS_TABLE, filtered) as Promise<Agent[]>;
	}, [] as Agent[]);
}

/** Single agent by id, reactively. Returns `null` when the agent
 *  doesn't exist or was soft-deleted. */
export function useAgent(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const a = await db.table<Agent>(AGENTS_TABLE).get(id);
			if (!a || a.deletedAt) return null;
			const [decrypted] = await decryptRecords(AGENTS_TABLE, [a]);
			return decrypted as Agent;
		},
		null as Agent | null
	);
}
