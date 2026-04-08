/**
 * Typed error classes for the LLM orchestrator. UI code can `instanceof`
 * these to render task-appropriate failure states (retry button, switch
 * tier prompt, "blocked by safety filter" notice, etc.).
 */

import type { LlmTier } from './tiers';

export class LlmError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LlmError';
	}
}

/** No tier from the user's preference list was able to run the task. */
export class NoTierAvailableError extends LlmError {
	constructor(
		public readonly taskName: string,
		public readonly attempted: LlmTier[]
	) {
		super(`No tier could run task '${taskName}' (attempted: ${attempted.join(', ') || 'none'})`);
		this.name = 'NoTierAvailableError';
	}
}

/** The user's chosen tier is below the task's declared minimum tier. */
export class TierTooLowError extends LlmError {
	constructor(
		public readonly taskName: string,
		public readonly requiredTier: LlmTier,
		public readonly userTier: LlmTier
	) {
		super(
			`Task '${taskName}' requires tier '${requiredTier}' but user is on '${userTier}'. Activate the higher tier in settings.`
		);
		this.name = 'TierTooLowError';
	}
}

/**
 * The upstream provider blocked the content (e.g. Gemini safety filter,
 * OpenAI moderation). The UI should offer "retry" + "switch to another
 * provider" options to the user — this is NOT auto-recoverable because
 * a different provider might allow the same content (or might not).
 */
export class ProviderBlockedError extends LlmError {
	constructor(
		public readonly tier: LlmTier,
		public readonly providerMessage: string
	) {
		super(`Provider '${tier}' blocked the request: ${providerMessage}`);
		this.name = 'ProviderBlockedError';
	}
}

/** Network/server error from a remote tier (mana-server, cloud). */
export class BackendUnreachableError extends LlmError {
	constructor(
		public readonly tier: LlmTier,
		public readonly httpStatus?: number,
		details?: string
	) {
		super(
			`Backend '${tier}' is unreachable${httpStatus ? ` (HTTP ${httpStatus})` : ''}${details ? `: ${details}` : ''}`
		);
		this.name = 'BackendUnreachableError';
	}
}

/**
 * The browser tier specifically failed to load — model download
 * interrupted, WebGPU adapter request failed, OOM, etc.
 */
export class EdgeLoadFailedError extends LlmError {
	constructor(public readonly cause: string) {
		super(`Edge LLM failed to load: ${cause}`);
		this.name = 'EdgeLoadFailedError';
	}
}
