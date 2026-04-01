/**
 * Svelte 5 reactive integration for LocalLLMEngine.
 *
 * Usage in a Svelte component:
 *   import { getLocalLlmStatus, loadLocalLlm, generateText } from '@manacore/local-llm';
 *
 *   const status = getLocalLlmStatus();
 *   loadLocalLlm();
 *   // use status.current reactively
 */

import { LocalLLMEngine, localLLM } from './engine';
import type { LoadingStatus, GenerateOptions, GenerateResult } from './types';
import type { ModelKey } from './models';

/**
 * Reactive status using Svelte 5 $state rune.
 */
let _status = $state<LoadingStatus>({ state: 'idle' });

localLLM.onStatusChange((s) => {
	_status = s;
});

export function getLocalLlmStatus(): { readonly current: LoadingStatus } {
	return {
		get current() {
			return _status;
		},
	};
}

/**
 * Load the model. Safe to call multiple times.
 */
export async function loadLocalLlm(model?: ModelKey): Promise<void> {
	return localLLM.load(model);
}

/**
 * Unload the model and free memory.
 */
export async function unloadLocalLlm(): Promise<void> {
	return localLLM.unload();
}

/**
 * Check if WebGPU is available.
 */
export function isLocalLlmSupported(): boolean {
	return LocalLLMEngine.isSupported();
}

/**
 * Generate with full options (messages, streaming, etc.)
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
	return localLLM.generate(options);
}

/**
 * Quick text generation from a single prompt.
 */
export async function generateText(
	prompt: string,
	opts?: { systemPrompt?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
	return localLLM.prompt(prompt, opts);
}

/**
 * Extract structured JSON from text.
 */
export async function extractJson<T = unknown>(text: string, instruction: string): Promise<T> {
	return localLLM.extractJson<T>(text, instruction);
}

/**
 * Classify text into one of the given categories.
 */
export async function classify(
	text: string,
	categories: string[],
	opts?: { context?: string }
): Promise<string> {
	return localLLM.classify(text, categories, opts);
}
