/**
 * BYOK Provider abstraction.
 *
 * Each supported third-party LLM (OpenAI, Anthropic, Gemini, Mistral, ...)
 * implements this interface. Adapters do the direct browser-to-provider
 * fetch using the user's API key.
 */

import type { ChatMessage, GenerateResult } from '../../types';

export type ByokProviderId = 'openai' | 'anthropic' | 'gemini' | 'mistral';

export interface ByokProvider {
	readonly id: ByokProviderId;
	readonly displayName: string;
	readonly defaultModel: string;
	readonly availableModels: readonly string[];

	/**
	 * Call the provider with the user's API key.
	 * Throws on network errors, auth errors, or content policy blocks.
	 */
	call(opts: ByokCallOptions): Promise<GenerateResult>;
}

export interface ByokCallOptions {
	apiKey: string;
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	maxTokens?: number;
	onToken?: (token: string) => void;
}

export interface ByokProviderError extends Error {
	provider: ByokProviderId;
	status?: number;
	code?: string;
}
