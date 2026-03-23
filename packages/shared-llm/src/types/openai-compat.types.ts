/**
 * OpenAI-compatible wire format types matching the mana-llm API contract.
 * These are internal types used for HTTP communication - consumers should
 * use the high-level types from chat.types.ts instead.
 */

import type { ChatMessage, TokenUsage } from './chat.types';

// ---------------------------------------------------------------------------
// Request (POST /v1/chat/completions)
// ---------------------------------------------------------------------------

export interface ChatCompletionRequest {
	model: string;
	messages: ChatMessage[];
	stream?: boolean;
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	stop?: string | string[];
}

// ---------------------------------------------------------------------------
// Response (non-streaming)
// ---------------------------------------------------------------------------

export interface ChatCompletionResponse {
	id: string;
	object: 'chat.completion';
	created: number;
	model: string;
	choices: ChatCompletionChoice[];
	usage: TokenUsage;
}

export interface ChatCompletionChoice {
	index: number;
	message: { role: 'assistant'; content: string };
	finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

// ---------------------------------------------------------------------------
// Response (streaming)
// ---------------------------------------------------------------------------

export interface ChatCompletionStreamChunk {
	id: string;
	object: 'chat.completion.chunk';
	created: number;
	model: string;
	choices: StreamChoice[];
}

export interface StreamChoice {
	index: number;
	delta: { role?: 'assistant'; content?: string };
	finish_reason: string | null;
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export interface EmbeddingRequest {
	model: string;
	input: string | string[];
	encoding_format?: 'float' | 'base64';
}

export interface EmbeddingResponse {
	object: 'list';
	data: EmbeddingData[];
	model: string;
	usage: TokenUsage;
}

export interface EmbeddingData {
	object: 'embedding';
	index: number;
	embedding: number[];
}

// ---------------------------------------------------------------------------
// Models (GET /v1/models)
// ---------------------------------------------------------------------------

export interface ModelsListResponse {
	object: 'list';
	data: Array<{
		id: string;
		object: 'model';
		created: number;
		owned_by: string;
	}>;
}
