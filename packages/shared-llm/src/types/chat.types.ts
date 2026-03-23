/**
 * Core chat types for the LLM client.
 * These are the high-level types that consumers interact with.
 */

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface TextContentPart {
	type: 'text';
	text: string;
}

export interface ImageContentPart {
	type: 'image_url';
	image_url: { url: string };
}

export type ContentPart = TextContentPart | ImageContentPart;

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | ContentPart[];
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ChatOptions {
	/** Model to use (default from module config, e.g. "ollama/gemma3:4b") */
	model?: string;
	/** Sampling temperature 0.0-2.0 */
	temperature?: number;
	/** Max tokens to generate */
	maxTokens?: number;
	/** System prompt prepended to messages */
	systemPrompt?: string;
	/** Request timeout in ms (overrides module default) */
	timeout?: number;
}

export interface JsonOptions<T = unknown> extends ChatOptions {
	/** Validation function applied to parsed JSON. Should throw on invalid data. */
	validate?: (data: unknown) => T;
	/** Number of extraction retries on parse failure (default: 1) */
	jsonRetries?: number;
}

export interface VisionOptions extends ChatOptions {
	/** Vision model override (default from module config, e.g. "ollama/llava:7b") */
	visionModel?: string;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface TokenUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

export interface ChatResult {
	/** Generated text content */
	content: string;
	/** Model that was actually used */
	model: string;
	/** Token usage statistics */
	usage: TokenUsage;
	/** Request latency in milliseconds */
	latencyMs: number;
}

export interface JsonResult<T = unknown> extends ChatResult {
	/** Parsed and optionally validated data */
	data: T;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export interface ModelInfo {
	id: string;
	object: 'model';
	created: number;
	owned_by: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthStatus {
	status: 'healthy' | 'degraded' | 'unhealthy';
	providers: Record<string, unknown>;
}
