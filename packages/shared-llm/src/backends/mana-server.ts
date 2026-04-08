/**
 * Mana-server backend — calls services/mana-llm with an Ollama model
 * string. mana-llm's ProviderRouter recognizes plain Ollama model names
 * (no provider prefix) and routes them to the local Ollama instance on
 * the Mac Mini, with automatic Gemini fallback if Ollama is overloaded.
 *
 * The default model is gemma3:4b — same model family as the browser
 * tier (Gemma 4 E2B is the smaller sibling), so prompts behave
 * consistently when a task auto-falls between tiers.
 */

import type { GenerateResult, LlmBackend, LlmTaskRequest } from '../types';
import { callManaLlmStreaming, resolveLlmBaseUrl } from './remote';

export interface ManaServerBackendOptions {
	/** Ollama model name to send to mana-llm. Default 'gemma3:4b'. */
	defaultModel?: string;
}

export class ManaServerBackend implements LlmBackend {
	readonly tier = 'mana-server' as const;
	private readonly defaultModel: string;

	constructor(opts: ManaServerBackendOptions = {}) {
		this.defaultModel = opts.defaultModel ?? 'gemma3:4b';
	}

	isAvailable(): boolean {
		// Available if we have a base URL configured at all. We don't
		// ping /health here — that adds latency to every isAvailable()
		// check. The first real call will fail loudly if mana-llm is down.
		return resolveLlmBaseUrl().length > 0;
	}

	isReady(): boolean {
		// Stateless from our side — assume ready if available.
		return this.isAvailable();
	}

	async generate(req: LlmTaskRequest): Promise<GenerateResult> {
		return callManaLlmStreaming(this.tier, this.defaultModel, req);
	}
}
