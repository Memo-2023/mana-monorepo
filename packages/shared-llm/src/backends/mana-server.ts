/**
 * Mana-server backend — calls services/mana-llm with an Ollama model
 * string. mana-llm's ProviderRouter recognizes plain Ollama model names
 * (no provider prefix) and routes them to the local Ollama instance on
 * the Mac Mini (running on the M4's Metal GPU), with automatic Gemini
 * fallback if Ollama is overloaded.
 *
 * The default model is gemma4:e4b — Google's Gemma 4 "Effective 4B"
 * variant, released 2026-04-02. Same family as @mana/local-llm's
 * browser tier model (Gemma 4 E2B is the smaller sibling) so prompts
 * behave consistently when a task auto-falls between tiers. e4b is
 * the right Mana-Server default because:
 *   - 9.6 GB on disk fits comfortably on the M4's 16 GB unified memory
 *   - 128K context window covers all current title/summarize tasks
 *   - The "Effective 4B" architecture punches well above its weight
 *     class (better than gemma3:4b on most German prompts)
 *   - The tier name we surface in the source label stays "Gemma 4"
 *     family for both browser and mana-server, so the UX is coherent
 */

import type { GenerateResult, LlmBackend, LlmTaskRequest } from '../types';
import { callManaLlmStreaming, resolveLlmBaseUrl } from './remote';

export interface ManaServerBackendOptions {
	/** Ollama model name to send to mana-llm. Default 'gemma4:e4b'. */
	defaultModel?: string;
}

export class ManaServerBackend implements LlmBackend {
	readonly tier = 'mana-server' as const;
	private readonly defaultModel: string;

	constructor(opts: ManaServerBackendOptions = {}) {
		this.defaultModel = opts.defaultModel ?? 'gemma4:e4b';
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
