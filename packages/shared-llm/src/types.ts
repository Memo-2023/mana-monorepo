/**
 * Shared types for the Mana LLM orchestrator.
 *
 * These deliberately mirror the surface of @mana/local-llm so that the
 * browser tier can pass them straight through, but they are intentionally
 * a SUPERSET (with task name, content class, capability requirements,
 * rule fallback) so the orchestrator can route intelligently.
 */

import type { LlmTier } from './tiers';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface GenerateOptions {
	messages: ChatMessage[];
	temperature?: number;
	maxTokens?: number;
	/** Optional streaming callback — called once per emitted token chunk */
	onToken?: (token: string) => void;
}

export interface GenerateResult {
	content: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	latencyMs: number;
}

/**
 * The privacy class of the input being processed. The orchestrator uses
 * this to ENFORCE that sensitive content never leaves the device, even
 * if the user has globally allowed cloud tiers.
 *
 *   public    — already public-domain content (e.g. an open URL the user
 *               wants summarized). Anything is fair game.
 *   personal  — the user's own content but routine (a calendar event, a
 *               todo title). Default for most module tasks. Allowed on
 *               any tier the user has enabled.
 *   sensitive — explicitly private content (notes flagged sensitive,
 *               diary entries, dreams, financial data). The orchestrator
 *               restricts these to {none, browser} regardless of user's
 *               global settings — the user has to explicitly opt out of
 *               this protection per-task to send sensitive content to
 *               server/cloud tiers.
 */
export type ContentClass = 'public' | 'personal' | 'sensitive';

export interface CapabilityRequirements {
	/** Task needs to receive structured JSON in response */
	json?: boolean;
	/** Task needs at least this many context tokens (input + output) */
	minContextTokens?: number;
	/** Task needs streaming support (per-token onToken callbacks) */
	streaming?: boolean;
}

/**
 * The high-level "I want to do X" descriptor that flows from a module
 * to the orchestrator. Concrete LlmTask implementations build these
 * internally before delegating to the orchestrator.
 */
export interface LlmTaskRequest extends GenerateOptions {
	/** Stable name for analytics + per-task overrides — e.g. "notes.extractTags" */
	taskName: string;
	contentClass: ContentClass;
	requires?: CapabilityRequirements;
}

/**
 * The result of running a task through the orchestrator. Carries the
 * tier that actually executed (which may differ from the user's
 * preferred tier if a fallback kicked in) and the trail of tiers
 * that were tried first — useful for telemetry and for debugging
 * "why did this task end up running on tier X?".
 */
export interface LlmTaskResult<T = string> {
	value: T;
	source: LlmTier;
	latencyMs: number;
	/** Tiers that were attempted before `source` succeeded */
	attempted: LlmTier[];
}

/**
 * Backend interface that the orchestrator talks to. The "none" tier
 * does NOT implement this — rule-based fallbacks live on each
 * concrete LlmTask, not on a backend object.
 */
export interface LlmBackend {
	readonly tier: Exclude<LlmTier, 'none'>;

	/** Could this backend run AT ALL given the current environment?
	 *  e.g. browser tier checks for WebGPU + user-enabled, server tier
	 *  checks for a configured base URL. */
	isAvailable(): boolean;

	/** Could this backend run RIGHT NOW? e.g. browser tier checks if
	 *  the model is loaded into VRAM. May return false even when
	 *  isAvailable() is true (model still downloading, server in
	 *  startup, …). */
	isReady(): boolean | Promise<boolean>;

	/** Run a task. The backend is responsible for actually performing
	 *  the inference and returning the result; it does NOT decide
	 *  whether it SHOULD run (the orchestrator did that). */
	generate(req: LlmTaskRequest): Promise<GenerateResult>;
}

/**
 * The mutable user preferences that drive routing.
 */
export interface LlmSettings {
	/** Tiers the orchestrator is allowed to use, in preference order.
	 *  An empty array means "no AI at all" — only Tier 0 (rules) runs. */
	allowedTiers: LlmTier[];

	/** Per-task overrides — keyed by task name, value is the tier to
	 *  use for that task specifically (overrides allowedTiers order). */
	taskOverrides: Record<string, LlmTier>;

	/** When the user-chosen tier fails to run a task, fall back to
	 *  the rules tier (if the task has a runT0 implementation).
	 *  When false, failures surface as errors instead. */
	fallbackToRulesOnError: boolean;

	/** Show a small "via Edge / via Server / via Gemini" badge under
	 *  every LLM result. Default true — helps the user understand
	 *  where their data went. */
	showSourceInUi: boolean;

	/** First-time consent for the cloud tier. Until this is true, the
	 *  cloud tier is treated as unavailable even if it's in
	 *  allowedTiers. The user must explicitly tick a "yes I understand
	 *  Google sees my data" checkbox once. */
	cloudConsentGiven: boolean;
}

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
	allowedTiers: [], // ZERO opt-in by default — every user starts in Tier 0 only
	taskOverrides: {},
	fallbackToRulesOnError: true,
	showSourceInUi: true,
	cloudConsentGiven: false,
};
