/**
 * Reactive queries over the `pendingProposals` Dexie table.
 *
 * Used by the AI workbench UI and by per-module proposal inboxes so each
 * module can render the AI's staged intents inline.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '../../database';
import { getTool } from '../../tools/registry';
import type { Proposal, ProposalStatus } from './types';
import { PROPOSALS_TABLE } from './types';

export interface UseProposalsOptions {
	/** Filter by lifecycle state. Defaults to `'pending'`. */
	status?: ProposalStatus;
	/** Filter to proposals whose intent targets tools in this module. */
	module?: string;
	/** Filter to a specific mission. */
	missionId?: string;
}

/**
 * Svelte 5 live query returning proposals matching the given filter.
 * Re-runs whenever `pendingProposals` changes.
 */
export function useAiProposals(options: UseProposalsOptions = {}) {
	const { status = 'pending', module, missionId } = options;
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<Proposal>(PROPOSALS_TABLE).orderBy('createdAt').reverse().toArray();
		return all.filter((p) => {
			if (p.status !== status) return false;
			if (missionId && p.missionId !== missionId) return false;
			if (module) {
				if (p.intent.kind !== 'toolCall') return false;
				const tool = getTool(p.intent.toolName);
				if (!tool || tool.module !== module) return false;
			}
			return true;
		});
	}, [] as Proposal[]);
}
