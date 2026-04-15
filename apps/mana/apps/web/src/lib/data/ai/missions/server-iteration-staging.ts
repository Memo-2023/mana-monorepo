/**
 * Server-iteration staging — translates server-produced Mission
 * iterations into local Proposals.
 *
 * The mana-ai Bun service writes plans back as a new `Mission.iterations[]`
 * entry with `source: 'server'`. When the webapp syncs, `applyServerChanges`
 * merges the new iterations array into the local record. This module
 * subscribes to those updates and, for each server iteration we haven't
 * processed yet, creates a Proposal per PlanStep via the existing
 * `createProposal` flow.
 *
 * Idempotency: each iteration id is tracked in a local Set so re-runs
 * (e.g. after tab reopen) don't duplicate proposals. Proposals that
 * successfully create get their id written back into `plan[i].proposalId`
 * so the Workbench UI links them; that also doubles as a durable
 * "already staged" marker surviving app restarts.
 */

import { liveQuery } from 'dexie';
import { db } from '../../database';
import { MISSIONS_TABLE } from './types';
import { createProposal } from '../proposals/store';
import { getMission } from './store';
import { runAsAsync, makeAgentActor, LEGACY_AI_PRINCIPAL } from '../../events/actor';
import type { Mission, MissionIteration, PlanStep } from './types';

const processedIterations = new Set<string>();
let subscription: { unsubscribe: () => void } | null = null;

/**
 * Start subscribing to aiMissions changes. Each time a server iteration
 * without staged proposals shows up, translate every PlanStep into a
 * local Proposal under the originating mission's AI actor.
 *
 * Idempotent — calling twice is a no-op. Returns a stop function.
 */
export function startServerIterationStaging(): () => void {
	if (subscription) return stopServerIterationStaging;

	const obs = liveQuery(() => db.table<Mission>(MISSIONS_TABLE).toArray());
	subscription = obs.subscribe({
		next: async (missions) => {
			for (const m of missions) {
				if (m.deletedAt) continue;
				for (const it of m.iterations) {
					if (it.source !== 'server') continue;
					if (processedIterations.has(it.id)) continue;
					// Pre-check: if any plan step already has a proposalId, the
					// server iteration was already staged (possibly by another
					// tab). Mark as processed so we don't race.
					const alreadyStaged = it.plan.some(
						(s) => typeof s.proposalId === 'string' && s.proposalId.length > 0
					);
					if (alreadyStaged) {
						processedIterations.add(it.id);
						continue;
					}
					try {
						await stageIteration(m, it);
						processedIterations.add(it.id);
					} catch (err) {
						console.error(
							`[server-staging] mission=${m.id} iteration=${it.id} failed:`,
							err instanceof Error ? err.message : String(err)
						);
					}
				}
			}
		},
		error: (err) => {
			console.error('[server-staging] subscription error:', err);
		},
	});
	return stopServerIterationStaging;
}

export function stopServerIterationStaging(): void {
	subscription?.unsubscribe();
	subscription = null;
}

/** Test hook — forget which iterations we've already staged. */
export function resetServerIterationStagingCache(): void {
	processedIterations.clear();
}

async function stageIteration(mission: Mission, iteration: MissionIteration): Promise<void> {
	// Re-read the freshest mission so concurrent local edits don't get
	// clobbered when we write proposalIds back into `plan[]`.
	const fresh = await getMission(mission.id);
	if (!fresh) return;
	const stagedStepIds: Record<string, string> = {};

	for (const step of iteration.plan) {
		const intent = step.intent;
		if (intent.kind !== 'toolCall') continue;
		if (step.proposalId) continue; // already staged

		// Phase 1: server-iteration writes under the legacy AI principal.
		// Phase 2 will swap this for the mission's owning-agent identity
		// once agents are wired into the data layer.
		const actor = makeAgentActor({
			agentId: LEGACY_AI_PRINCIPAL,
			displayName: 'Mana',
			missionId: mission.id,
			iterationId: iteration.id,
			rationale: step.summary || iteration.summary || mission.objective,
		});

		// createProposal runs through Dexie hooks under the AI actor — the
		// row lands in `pendingProposals` and the AiProposalInbox renders
		// it as a ghost card on the relevant module page.
		const proposal = await runAsAsync(actor, () =>
			createProposal({
				actor,
				intent: {
					kind: 'toolCall',
					toolName: intent.toolName,
					params: intent.params,
				},
				rationale: actor.rationale,
			})
		);
		stagedStepIds[step.id] = proposal.id;
	}

	if (Object.keys(stagedStepIds).length === 0) return;

	// Write proposalIds back onto the iteration's plan[] so the Workbench
	// UI links each step to its proposal AND so other tabs skip re-staging.
	const updatedIterations: MissionIteration[] = fresh.iterations.map((it) => {
		if (it.id !== iteration.id) return it;
		const updatedPlan: PlanStep[] = it.plan.map((s) =>
			stagedStepIds[s.id] ? { ...s, proposalId: stagedStepIds[s.id], status: 'staged' as const } : s
		);
		return { ...it, plan: updatedPlan };
	});
	await db.table(MISSIONS_TABLE).update(fresh.id, {
		iterations: updatedIterations,
		updatedAt: new Date().toISOString(),
	});
}
