/**
 * Template applicator — turns a WorkbenchTemplate from `@mana/shared-ai`
 * into concrete Dexie records: optionally an Agent, optionally a
 * workbench Scene, optionally starter Missions, optionally module-
 * scoped seeds.
 *
 * Ordering matters:
 *   1. Agent (so mission.agentId can reference it)
 *   2. Scene (so `setActive` lands on the right layout)
 *   3. Missions (so they show up under the agent)
 *   4. Seeds per module (runs last because a seed might reference
 *      the freshly-active scene conceptually but never programmatically)
 *
 * Error semantics: failures bubble up as warnings in the result — they
 * don't abort later steps. Pure-transaction semantics aren't worth the
 * wrapper complexity since each step is idempotent-ish on re-apply:
 *   - duplicate agent name → returns existing agent (getOrCreate-ish)
 *   - scene creation is a fresh insert (skipped if agent was existing)
 *   - missions use fresh UUIDs
 *   - seeds check stableId before creating
 */

import { createAgent, findByName, DuplicateAgentNameError } from './store';
import { createMission, pauseMission } from '../missions/store';
import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
import { getSeedHandler, type SeedOutcome } from './seed-registry';
import type { WorkbenchTemplate, WorkbenchTemplateSeedItem } from '@mana/shared-ai';
import type { Agent } from './types';

export interface ApplyTemplateOptions {
	/** Create the template's scene + set it active. Default true when the
	 *  template defines a scene; false when it doesn't. */
	createScene?: boolean;
	/** Create the template's starter missions. Default true. */
	createMissions?: boolean;
	/** Apply the template's per-module seeds. Default true. */
	applySeeds?: boolean;
	/** When true, starter missions are left in whatever `startPaused`
	 *  the template declares (usually paused). When false, override to
	 *  active — Power-User opt-in that skips the "click Play" step. */
	respectPauseHint?: boolean;
}

export interface ApplyTemplateResult {
	/** The agent that was created OR re-used. Undefined when the
	 *  template had no `agent` part (non-AI templates). */
	readonly agent?: Agent;
	/** True when we re-used an existing agent with the same name. */
	readonly wasExistingAgent: boolean;
	readonly sceneId?: string;
	readonly missionIds: readonly string[];
	/** Per-module seed outcomes keyed by module name. */
	readonly seedOutcomes: Readonly<Record<string, readonly SeedOutcome[]>>;
	/** Non-fatal warnings from any step; UI surfaces these alongside
	 *  the success panel. */
	readonly warnings: readonly string[];
}

/**
 * Apply a template end-to-end. Returns a result object describing what
 * actually landed in Dexie. Call sites render a success or partial-
 * failure panel based on warnings + presence of each field.
 */
export async function applyTemplate(
	template: WorkbenchTemplate,
	opts: ApplyTemplateOptions = {}
): Promise<ApplyTemplateResult> {
	const {
		createScene = template.scene !== undefined,
		createMissions = true,
		applySeeds = true,
		respectPauseHint = true,
	} = opts;

	const warnings: string[] = [];
	let agent: Agent | undefined;
	let wasExistingAgent = false;

	// 1. Agent (optional) — idempotent via duplicate-name lookup.
	if (template.agent) {
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
				if (!existing) throw err;
				agent = existing;
				wasExistingAgent = true;
				warnings.push(
					`Ein Agent mit Namen "${template.agent.name}" existiert bereits — Template nutzt diesen.`
				);
			} else {
				throw err;
			}
		}
	}

	// 2. Scene — skipped on re-apply (wasExistingAgent) so we don't
	// generate Scene-Clones on every click. For non-agent templates the
	// scene is always created (there's no per-apply dedup key).
	let sceneId: string | undefined;
	if (createScene && template.scene && !wasExistingAgent) {
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
	} else if (createScene && wasExistingAgent) {
		warnings.push(
			'Scene übersprungen weil der Agent schon existierte — öffne die Scene manuell falls gewünscht.'
		);
	}

	// 3. Missions — paused by default per template hint.
	const missionIds: string[] = [];
	if (createMissions && template.missions && agent) {
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

	// 4. Per-module seeds — applicator looks up a handler for each
	// module name in the template's `seeds` map. Missing handler =
	// warning, not fatal (template lists seeds for a module the webapp
	// doesn't support yet).
	const seedOutcomes: Record<string, readonly SeedOutcome[]> = {};
	if (applySeeds && template.seeds) {
		const seedEntries = Object.entries(template.seeds) as Array<
			[string, readonly WorkbenchTemplateSeedItem[]]
		>;
		for (const [moduleName, items] of seedEntries) {
			const handler = getSeedHandler(moduleName);
			if (!handler) {
				warnings.push(
					`Seed-Handler für Modul "${moduleName}" nicht registriert — ${items.length} Seed(s) übersprungen.`
				);
				continue;
			}
			try {
				const outcomes = await handler.apply(items);
				seedOutcomes[moduleName] = outcomes;
				const failures = outcomes.filter((o) => o.outcome === 'failed');
				for (const f of failures) {
					warnings.push(
						`Seed "${f.stableId ?? '(ohne id)'}" in ${moduleName} fehlgeschlagen: ${f.error ?? '(unbekannt)'}`
					);
				}
			} catch (err) {
				warnings.push(
					`Seed-Handler für "${moduleName}" hat unerwartet geworfen: ${err instanceof Error ? err.message : String(err)}`
				);
			}
		}
	}

	return {
		agent,
		wasExistingAgent,
		sceneId,
		missionIds,
		seedOutcomes,
		warnings,
	};
}
