/**
 * Typed error classes for the LLM orchestrator. UI code can `instanceof`
 * these to render task-appropriate failure states (retry button, switch
 * tier prompt, "blocked by safety filter" notice, etc.).
 */

import type { LlmTier } from './tiers';

const SETTINGS_LINK = '[KI-Einstellungen öffnen](/?app=settings#ai-options)';

export class LlmError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LlmError';
	}

	/** User-friendly German explanation with settings deep-link (Markdown). */
	getUserMessage(): string {
		return `${this.message}\n\n${SETTINGS_LINK}`;
	}
}

/** Why a specific tier was skipped. */
export type TierSkipReason =
	| 'no-consent'
	| 'no-backend'
	| 'not-available'
	| 'not-ready'
	| 'no-tiers-configured'
	| 'runtime-error';

export interface SkippedTier {
	tier: LlmTier;
	reason: TierSkipReason;
}

/** No tier from the user's preference list was able to run the task. */
export class NoTierAvailableError extends LlmError {
	constructor(
		public readonly taskName: string,
		public readonly attempted: LlmTier[],
		public readonly skipped: SkippedTier[] = []
	) {
		super(`No tier could run task '${taskName}' (attempted: ${attempted.join(', ') || 'none'})`);
		this.name = 'NoTierAvailableError';
	}

	/** User-friendly German explanation of what went wrong (Markdown). */
	getUserMessage(): string {
		const settingsLink = '[KI-Einstellungen öffnen](/?app=settings#ai-options)';

		if (this.skipped.length === 0 && this.attempted.length === 0) {
			return `Kein KI-Modell konfiguriert.\n\n${settingsLink}`;
		}

		const reasons = this.skipped.map((s) => {
			switch (s.reason) {
				case 'no-consent':
					return `**${tierLabel(s.tier)}**: Cloud-Einwilligung fehlt.`;
				case 'no-backend':
					return `**${tierLabel(s.tier)}**: Backend nicht registriert.`;
				case 'not-available':
					return `**${tierLabel(s.tier)}**: Nicht verfügbar (Service läuft nicht oder WebGPU nicht unterstützt).`;
				case 'not-ready':
					return `**${tierLabel(s.tier)}**: Modell noch nicht geladen.`;
				case 'runtime-error':
					return `**${tierLabel(s.tier)}**: Fehler bei der Ausführung.`;
				case 'no-tiers-configured':
					return 'Kein KI-Modell konfiguriert.';
			}
		});
		return `${reasons.join('\n')}\n\n${settingsLink}`;
	}
}

function tierLabel(tier: LlmTier): string {
	switch (tier) {
		case 'browser':
			return 'Browser (lokal)';
		case 'mana-server':
			return 'Mana Server';
		case 'cloud':
			return 'Cloud (Gemini)';
		case 'byok':
			return 'Eigener API-Key';
		default:
			return String(tier);
	}
}

/** The user's chosen tier is below the task's declared minimum tier. */
export class TierTooLowError extends LlmError {
	constructor(
		public readonly taskName: string,
		public readonly requiredTier: LlmTier,
		public readonly userTier: LlmTier
	) {
		super(`Task '${taskName}' requires tier '${requiredTier}' but user is on '${userTier}'.`);
		this.name = 'TierTooLowError';
	}

	getUserMessage(): string {
		const needed = tierLabel(this.requiredTier);
		return `Kein KI-Modell aktiviert. Mindestens **${needed}** wird benötigt.\n\n${SETTINGS_LINK}`;
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

	getUserMessage(): string {
		return `**${tierLabel(this.tier)}** hat die Anfrage blockiert (Inhaltsfilter). Versuche es mit einer anderen Formulierung oder wechsle den Anbieter.\n\n${SETTINGS_LINK}`;
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

	getUserMessage(): string {
		return `**${tierLabel(this.tier)}** ist nicht erreichbar. Prüfe ob der Service läuft.\n\n${SETTINGS_LINK}`;
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

	getUserMessage(): string {
		return `Browser-Modell konnte nicht geladen werden: ${this.cause}\n\n${SETTINGS_LINK}`;
	}
}
