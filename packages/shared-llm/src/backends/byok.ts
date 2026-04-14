/**
 * BYOK Backend — routes LLM calls through the user's own API keys.
 *
 * The backend itself lives in shared-llm (so the orchestrator can
 * instantiate it alongside browser/mana-server/cloud), but the
 * actual keys live in the consuming app's encrypted IndexedDB.
 *
 * Apps inject a `ByokKeyResolver` callback at init time. The backend
 * calls it whenever it needs a key, gets back `{ apiKey, model,
 * provider }`, and dispatches to the matching provider adapter.
 *
 * If no key is configured for any provider, isAvailable() returns
 * false and the orchestrator skips this tier.
 */

import type { GenerateResult, LlmBackend, LlmTaskRequest } from '../types';
import type { ByokProvider, ByokProviderId } from './byok-providers/types';

export interface ResolvedByokKey {
	provider: ByokProviderId;
	apiKey: string;
	model: string;
}

/** App-side callback — looks up the appropriate key for a call. */
export type ByokKeyResolver = (opts: {
	/** Task name from LlmTaskRequest (e.g. "companion.chat") */
	taskName: string;
	/** Optional user-forced provider (from settings.byok.defaultProvider
	 *  or from task-specific override like 'byok:anthropic') */
	preferredProvider?: ByokProviderId;
}) => Promise<ResolvedByokKey | null>;

/** Called after a successful generation so the app can increment usage counters. */
export type ByokUsageCallback = (opts: {
	provider: ByokProviderId;
	model: string;
	promptTokens: number;
	completionTokens: number;
	latencyMs: number;
}) => void;

export interface ByokBackendOptions {
	resolver: ByokKeyResolver;
	providers: readonly ByokProvider[];
	onUsage?: ByokUsageCallback;
}

export class ByokBackend implements LlmBackend {
	readonly tier = 'byok' as const;
	private readonly resolver: ByokKeyResolver;
	private readonly providers: Map<ByokProviderId, ByokProvider>;
	private readonly onUsage?: ByokUsageCallback;
	/** Whether at least one key has been configured. Set after first
	 *  resolver call; the orchestrator uses isAvailable() to skip the
	 *  tier when the user hasn't added any keys yet. */
	private keyConfigured: boolean | null = null;

	constructor(opts: ByokBackendOptions) {
		this.resolver = opts.resolver;
		this.providers = new Map(opts.providers.map((p) => [p.id, p]));
		this.onUsage = opts.onUsage;
	}

	/** Inform the backend that the user has added/removed keys — flips
	 *  the cached availability flag so isAvailable() re-probes on the
	 *  next call. */
	invalidateAvailability(): void {
		this.keyConfigured = null;
	}

	isAvailable(): boolean {
		// If we haven't probed yet, assume available and let resolver
		// fail gracefully. After the first resolver miss we cache false.
		return this.keyConfigured !== false;
	}

	async isReady(): Promise<boolean> {
		// Probe with a null task to see if *any* key resolves
		try {
			const key = await this.resolver({ taskName: '__probe__' });
			this.keyConfigured = key !== null;
			return this.keyConfigured;
		} catch {
			this.keyConfigured = false;
			return false;
		}
	}

	async generate(req: LlmTaskRequest): Promise<GenerateResult> {
		// Parse optional provider override from task name (e.g. "companion.chat"
		// with a taskOverride of "byok:anthropic" → caller should pass
		// preferredProvider via the resolver path, not via taskName).
		const resolved = await this.resolver({ taskName: req.taskName });
		if (!resolved) {
			this.keyConfigured = false;
			throw new Error(
				'Kein BYOK-Schluessel konfiguriert. Bitte unter Einstellungen → KI-Keys hinterlegen.'
			);
		}
		this.keyConfigured = true;

		const provider = this.providers.get(resolved.provider);
		if (!provider) {
			throw new Error(`BYOK-Provider nicht unterstuetzt: ${resolved.provider}`);
		}

		const startedAt = Date.now();
		const result = await provider.call({
			apiKey: resolved.apiKey,
			model: resolved.model,
			messages: req.messages,
			temperature: req.temperature,
			maxTokens: req.maxTokens,
			onToken: req.onToken,
		});
		const latencyMs = Date.now() - startedAt;

		// Report usage so the app can update per-key counters
		if (this.onUsage && result.usage) {
			this.onUsage({
				provider: resolved.provider,
				model: resolved.model,
				promptTokens: result.usage.promptTokens,
				completionTokens: result.usage.completionTokens,
				latencyMs,
			});
		}

		return { ...result, latencyMs };
	}
}
