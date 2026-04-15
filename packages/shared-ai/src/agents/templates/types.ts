/**
 * Agent-Template shape — a bundle of (agent config, optional scene
 * layout, optional starter missions) that the webapp applies as a
 * single unit when the user picks it from the template gallery.
 *
 * Templates are pure data: no runtime imports, no side effects, no
 * references to Dexie / Svelte. The webapp's `apply-template.ts`
 * orchestrator is the only code that turns a template into concrete
 * records. This keeps the templates trivial to author (drop a file
 * next to this one) and keeps shared-ai dependency-free.
 */

import type { AiPolicy } from '../../policy/types';
import type { MissionCadence, MissionInputRef } from '../../missions/types';

export interface AgentTemplateAgentPart {
	/** Display name — the user can rename after creation. Must be unique
	 *  at apply-time; the orchestrator deduplicates via `createAgent`. */
	name: string;
	/** Emoji or short string. Shown on the card + everywhere the agent
	 *  appears in UI. */
	avatar: string;
	/** Short user-facing description ("what this agent does for you"). */
	role: string;
	/** Optional pre-filled systemPrompt. Encrypted at rest. */
	systemPrompt?: string;
	/** Optional pre-filled memory. Encrypted at rest. */
	memory?: string;
	/** Per-tool + per-module decisions. Templates reuse the DEFAULT_AI_POLICY
	 *  and layer tweaks on top. Undefined → DEFAULT_AI_POLICY. */
	policy?: AiPolicy;
	/** Optional budget; undefined = no daily cap. */
	maxTokensPerDay?: number;
	/** Default 1 (serial). */
	maxConcurrentMissions?: number;
}

export interface AgentTemplateSceneApp {
	readonly appId: string;
	readonly widthPx?: number;
	readonly maximized?: boolean;
}

export interface AgentTemplateScenePart {
	/** Display name for the scene tab. */
	name: string;
	description?: string;
	openApps: readonly AgentTemplateSceneApp[];
}

export interface AgentTemplateMissionPart {
	title: string;
	objective: string;
	conceptMarkdown: string;
	cadence: MissionCadence;
	inputs?: readonly MissionInputRef[];
	/** Whether the mission should be immediately active. Templates
	 *  default to `paused` so the user has to hit Play — avoids
	 *  surprise autonomous work on first use. */
	startPaused?: boolean;
}

export interface AgentTemplate {
	/** Stable id, used for analytics + "this template was applied" detection. */
	id: string;
	/** Short display label for the gallery card. */
	label: string;
	/** One-line tagline under the label. */
	tagline: string;
	/** Longer body for the card's detail pane. Can be markdown. */
	description: string;
	/** Category / tag for grouping in the gallery. */
	category: 'research' | 'context' | 'today' | 'custom';
	/** Accent color for the card. */
	color: string;

	agent: AgentTemplateAgentPart;
	/** Optional — when absent, no scene is created. When present, the
	 *  orchestrator creates a scene pre-populated with these apps. */
	scene?: AgentTemplateScenePart;
	/** Optional starter missions. Each defaults to `startPaused: true`
	 *  so autonomous work doesn't start without explicit user consent. */
	missions?: readonly AgentTemplateMissionPart[];
}
