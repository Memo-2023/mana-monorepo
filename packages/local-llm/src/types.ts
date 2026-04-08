/**
 * Types for client-side LLM inference.
 * Aligned with @mana/shared-llm ChatMessage/ChatResult where possible.
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
	/** HuggingFace ONNX repo id, e.g. "onnx-community/gemma-4-E2B-it-ONNX" */
	modelId: string;
	/** Human-readable name */
	displayName: string;
	/**
	 * Quantization the transformers.js loader should request. Common values:
	 *   - "fp32"   — full precision, biggest, only for tiny models
	 *   - "fp16"   — half precision, ~50% smaller than fp32
	 *   - "q8"     — 8-bit weights, fp32 activations
	 *   - "q4"     — 4-bit weights, fp32 activations
	 *   - "q4f16"  — 4-bit weights, fp16 activations (recommended for WebGPU)
	 */
	dtype: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';
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
