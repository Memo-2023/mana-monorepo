/**
 * Template applicator — turns an AgentTemplate from `@mana/shared-ai`
 * into concrete Dexie records: an Agent, optionally a workbench Scene,
 * optionally starter Missions.
 *
 * Ordering matters: agent first (so mission.agentId can reference it),
 * then scene (so `setActive` lands on a scene that contains the
 * relevant apps), then missions (so they show up under the agent).
 *
 * Error semantics: failures bubble up but the ones that happened
 * before are NOT rolled back — user is told what did and didn't land.
 * Pure-transaction semantics aren't worth the wrapper complexity for
 * a 3-step sequence that is already idempotent:
 *   - duplicate agent name → returns existing agent (getOrCreate-ish)
 *   - scene creation is a fresh insert, no dedup needed
 *   - missions use fresh UUIDs, no dedup needed
 */

import { createAgent, findByName, DuplicateAgentNameError } from './store';
import { createMission, pauseMission } from '../missions/store';
import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
import type { AgentTemplate } from '@mana/shared-ai';
import type { Agent } from './types';

export interface ApplyTemplateOptions {
	/** Create the template's scene + set it active. Default true when the
	 *  template defines a scene; false when it doesn't. */
	createScene?: boolean;
	/** Create the template's starter missions. Default true. */
	createMissions?: boolean;
	/** When true, starter missions are left in whatever `startPaused`
	 *  the template declares (usually paused). When false, override to
	 *  active — Power-User opt-in that skips the "click Play" step. */
	respectPauseHint?: boolean;
}

export interface ApplyTemplateResult {
	/** The agent that was created — OR the pre-existing agent with the
	 *  same name that we re-used. `wasExisting` tells you which. */
	readonly agent: Agent;
	readonly wasExisting: boolean;
	readonly sceneId?: string;
	readonly missionIds: readonly string[];
	/** Any non-fatal errors from the sequence. Agent is guaranteed when
	 *  this array is empty on agent slot; scene/mission failures still
	 *  return here so the UI can surface them without blocking. */
	readonly warnings: readonly string[];
}

/**
 * Apply a template end-to-end. Returns a result object describing what
 * actually landed in Dexie. Call sites render a success panel or a
 * partial-failure panel based on `warnings` + presence of each field.
 */
export async function applyTemplate(
	template: AgentTemplate,
	opts: ApplyTemplateOptions = {}
): Promise<ApplyTemplateResult> {
	const {
		createScene = template.scene !== undefined,
		createMissions = true,
		respectPauseHint = true,
	} = opts;

	const warnings: string[] = [];

	// 1. Agent — the only required piece. If duplicate name, re-use the
	// existing agent (idempotent "apply twice" behavior).
	let agent: Agent;
	let wasExisting = false;
	try {
		agent = await createAgent({
			name: template.agent.name,
			avatar: template.agent.avatar,
			role: template.agent.role,
			systemPrompt: template.agent.systemPrompt,
			memory: template.agent.memory,
			policy: template.agent.policy,
			maxTokensPerDay: template.agent.maxTokensPerDay,
			maxConcurrentMissions: template.agent.maxConcurrentMissions,
		});
	} catch (err) {
		if (err instanceof DuplicateAgentNameError) {
			const existing = await findByName(template.agent.name);
			if (!existing) {
				throw err;
			}
			agent = existing;
			wasExisting = true;
			warnings.push(
				`Ein Agent mit Namen "${template.agent.name}" existiert bereits — Template nutzt diesen.`
			);
		} else {
			throw err;
		}
	}

	// 2. Scene — skipped on re-apply so we don't generate Scene-Clones
	// on every click.
	let sceneId: string | undefined;
	if (createScene && template.scene && !wasExisting) {
		try {
			sceneId = await workbenchScenesStore.createScene({
				name: template.scene.name,
				description: template.scene.description ?? null,
				seedApps: [...template.scene.openApps],
				setActive: true,
			});
		} catch (err) {
			warnings.push(
				`Scene konnte nicht angelegt werden: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	} else if (createScene && wasExisting) {
		warnings.push(
			'Scene übersprungen weil der Agent schon existierte — öffne die Scene manuell falls gewünscht.'
		);
	}

	// 3. Missions — paused by default per template hint. Reapply on an
	// existing agent is idempotent-ish: we create NEW missions (they
	// have fresh UUIDs) but the UI should make that obvious.
	const missionIds: string[] = [];
	if (createMissions && template.missions) {
		for (const m of template.missions) {
			try {
				const mission = await createMission({
					title: m.title,
					objective: m.objective,
					conceptMarkdown: m.conceptMarkdown,
					cadence: m.cadence,
					inputs: m.inputs ? [...m.inputs] : undefined,
					agentId: agent.id,
				});
				if (respectPauseHint && m.startPaused !== false) {
					await pauseMission(mission.id);
				}
				missionIds.push(mission.id);
			} catch (err) {
				warnings.push(
					`Starter-Mission "${m.title}" fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`
				);
			}
		}
	}

	return {
		agent,
		wasExisting,
		sceneId,
		missionIds,
		warnings,
	};
}
