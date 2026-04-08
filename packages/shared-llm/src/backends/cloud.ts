/**
 * Cloud backend — calls services/mana-llm with a `google/...` model
 * string. mana-llm's ProviderRouter recognizes the `google/` prefix
 * and routes to its Google Gemini provider, which holds the API key
 * server-side (we never expose the key to the browser).
 *
 * Default model is google/gemini-2.0-flash. The mana-llm google.py
 * provider also supports gemini-2.5-pro for higher-quality calls but
 * 2.0-flash is the right default — fast, cheap, multimodal, plenty
 * good for the kind of structured-output tasks Mana modules need.
 *
 * Cloud is gated by `cloudConsentGiven` in LlmSettings — even if a
 * user has 'cloud' in their allowedTiers, the orchestrator will skip
 * this backend until they've ticked the consent checkbox once.
 */

import type { GenerateResult, LlmBackend, LlmTaskRequest } from '../types';
import { callManaLlmStreaming, resolveLlmBaseUrl } from './remote';

export interface CloudBackendOptions {
	/** Gemini model to send. Default 'google/gemini-2.0-flash'. */
	defaultModel?: string;
}

export class CloudBackend implements LlmBackend {
	readonly tier = 'cloud' as const;
	private readonly defaultModel: string;

	constructor(opts: CloudBackendOptions = {}) {
		this.defaultModel = opts.defaultModel ?? 'google/gemini-2.0-flash';
	}

	isAvailable(): boolean {
		return resolveLlmBaseUrl().length > 0;
	}

	isReady(): boolean {
		return this.isAvailable();
	}

	async generate(req: LlmTaskRequest): Promise<GenerateResult> {
		return callManaLlmStreaming(this.tier, this.defaultModel, req);
	}
}
