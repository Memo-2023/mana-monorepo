/**
 * Types for client-side LLM inference.
 * Aligned with @manacore/shared-llm ChatMessage/ChatResult where possible.
 */

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface GenerateOptions {
	/** Messages to send */
	messages: ChatMessage[];
	/** Sampling temperature 0.0-2.0 (default: 0.7) */
	temperature?: number;
	/** Max tokens to generate (default: 1024) */
	maxTokens?: number;
	/** Callback for each generated token (streaming) */
	onToken?: (token: string) => void;
}

export interface GenerateResult {
	/** Generated text */
	content: string;
	/** Token usage */
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	/** Generation time in ms */
	latencyMs: number;
}

export interface ModelConfig {
	/** WebLLM model identifier */
	modelId: string;
	/** Human-readable name */
	displayName: string;
	/** Approximate download size in MB */
	downloadSizeMb: number;
	/** Approximate VRAM/RAM usage in MB */
	ramUsageMb: number;
	/** Default system prompt */
	defaultSystemPrompt?: string;
}

export type LoadingStatus =
	| { state: 'idle' }
	| { state: 'checking' }
	| { state: 'downloading'; progress: number; text: string }
	| { state: 'loading'; text: string }
	| { state: 'ready' }
	| { state: 'error'; error: string };
