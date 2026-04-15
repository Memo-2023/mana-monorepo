/**
 * Workbench-Template shape — a bundle of (optional agent config,
 * optional scene layout, optional starter missions, optional
 * per-module seed data) that the webapp applies as a single unit
 * when the user picks it from the /agents/templates gallery.
 *
 * Templates are pure data: no runtime imports, no side effects, no
 * references to Dexie / Svelte. The webapp's `apply-template.ts`
 * orchestrator is the only code that turns a template into concrete
 * records. This keeps templates trivial to author (drop a file next
 * to the existing ones) and keeps shared-ai dependency-free.
 *
 * Originally named `AgentTemplate` (shipped in Phase 5 of the
 * Multi-Agent Workbench). Generalised in T1 of the Workbench-Templates
 * plan (docs/plans/workbench-templates.md) so templates can exist
 * WITHOUT an agent (e.g. a Calmness wellness starter-kit).
 */

import type { AiPolicy } from '../../policy/types';
import type { MissionCadence, MissionInputRef } from '../../missions/types';

export type WorkbenchTemplateCategory = 'ai' | 'wellness' | 'work' | 'lifeEvent' | 'delight';

export interface WorkbenchTemplateAgentPart {
	name: string;
	avatar: string;
	role: string;
	systemPrompt?: string;
	memory?: string;
	policy?: AiPolicy;
	maxTokensPerDay?: number;
	maxConcurrentMissions?: number;
}

export interface WorkbenchTemplateSceneApp {
	readonly appId: string;
	readonly widthPx?: number;
	readonly maximized?: boolean;
}

export interface WorkbenchTemplateScenePart {
	name: string;
	description?: string;
	openApps: readonly WorkbenchTemplateSceneApp[];
}

export interface WorkbenchTemplateMissionPart {
	title: string;
	objective: string;
	conceptMarkdown: string;
	cadence: MissionCadence;
	inputs?: readonly MissionInputRef[];
	startPaused?: boolean;
}

/**
 * One seeded record in a module. The Applicator passes these to the
 * module's SeedHandler by name; the handler unpacks `data` according
 * to its own schema.
 */
export interface WorkbenchTemplateSeedItem {
	/** Stable identifier for idempotent re-apply. When set, the handler
	 *  looks up an existing record with the same stableId and skips
	 *  re-creation. When unset, a fresh record is created on every
	 *  apply (UUID-random). */
	readonly stableId?: string;
	/** Module-specific payload. The seed handler for the matching
	 *  module name knows the shape. Typed as `unknown` here so shared-ai
	 *  doesn't import the webapp's module types. */
	readonly data: unknown;
}

export interface WorkbenchTemplate {
	readonly id: string;
	/** Schema/content version stamped on the scene when applied — used
	 *  later for update-detection. Start at '1'. */
	readonly version: string;
	readonly label: string;
	readonly tagline: string;
	readonly description: string;
	readonly category: WorkbenchTemplateCategory;
	readonly color: string;
	/** Icon emoji for the gallery card when no agent avatar is present. */
	readonly icon: string;

	// All component parts are optional — a template can be agent-only,
	// scene-only, seeds-only, or any combination.
	readonly agent?: WorkbenchTemplateAgentPart;
	readonly scene?: WorkbenchTemplateScenePart;
	readonly missions?: readonly WorkbenchTemplateMissionPart[];
	/** Module-name → seed items for that module. Keys match module
	 *  names from apps/mana/apps/web/src/lib/modules/*. Unknown keys
	 *  are reported as warnings by the applicator, not fatal. */
	readonly seeds?: Readonly<Record<string, readonly WorkbenchTemplateSeedItem[]>>;
}

// ─── Backward-compat aliases ─────────────────────────────────
// Pre-T1 name. Existing templates (research/context/today) typed
// themselves as `AgentTemplate`; keep the aliases so nothing breaks.
// New templates should use `WorkbenchTemplate` directly.

export type AgentTemplate = WorkbenchTemplate;
export type AgentTemplateAgentPart = WorkbenchTemplateAgentPart;
export type AgentTemplateScenePart = WorkbenchTemplateScenePart;
export type AgentTemplateSceneApp = WorkbenchTemplateSceneApp;
export type AgentTemplateMissionPart = WorkbenchTemplateMissionPart;
