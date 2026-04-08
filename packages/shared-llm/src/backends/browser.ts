/**
 * Browser-edge backend — wraps @mana/local-llm.
 *
 * Inference happens 100% on the user's device via WebGPU. The model
 * (currently Gemma 4 E2B) is a one-time ~500 MB download cached in the
 * browser. We do NOT auto-load on backend creation; the user has to
 * explicitly trigger a load via the settings page or by using a feature
 * that calls `ensureLoaded()`. This avoids surprising 500 MB downloads.
 */

import {
	localLLM,
	LocalLLMEngine,
	loadLocalLlm,
	type ChatMessage as LocalChatMessage,
} from '@mana/local-llm';
import { EdgeLoadFailedError } from '../errors';
import type { GenerateResult, LlmBackend, LlmTaskRequest } from '../types';

export class BrowserBackend implements LlmBackend {
	readonly tier = 'browser' as const;

	isAvailable(): boolean {
		return LocalLLMEngine.isSupported();
	}

	isReady(): boolean {
		return localLLM.isReady;
	}

	/** Trigger the one-time model download + WebGPU initialization.
	 *  Idempotent — safe to call repeatedly. Throws EdgeLoadFailedError
	 *  on failure (model corrupt, WebGPU OOM, etc.). */
	async ensureLoaded(): Promise<void> {
		try {
			await loadLocalLlm();
		} catch (err) {
			throw new EdgeLoadFailedError(err instanceof Error ? err.message : String(err));
		}
	}

	async generate(req: LlmTaskRequest): Promise<GenerateResult> {
		await this.ensureLoaded();

		const result = await localLLM.generate({
			messages: req.messages as LocalChatMessage[],
			temperature: req.temperature,
			maxTokens: req.maxTokens,
			onToken: req.onToken,
		});

		return {
			content: result.content,
			usage: {
				promptTokens: result.usage.prompt_tokens,
				completionTokens: result.usage.completion_tokens,
				totalTokens: result.usage.total_tokens,
			},
			latencyMs: result.latencyMs,
		};
	}
}
